/* eslint-env node */
module.exports = createNamedModuleVisitor;

/*::
  type RefsHandlerT = (t: Object, context: Object, refs: Object[]) => any;
*/

/**
 * Visits all references to a given module from a given package
 */
function createNamedModuleVisitor(
  t /*: Object */,
  moduleName /*: string | Array<string> */,
  packageName /*: string | Array<string> */,
  refsHandler /*: RefsHandlerT */
) {
  const compareToModuleName = Array.isArray(moduleName)
    ? s => moduleName.includes(s)
    : s => s === moduleName;
  return {
    /**
     * Handle ES imports
     *
     * import {moduleName} from 'packageName';
     */
    ImportDeclaration(path /*: Object */, state /*: Object */) {
      const sourceName = path.get('source').node.value;
      if (
        (Array.isArray(packageName) &&
          packageName.indexOf(sourceName) === -1) ||
        (typeof packageName === 'string' && sourceName !== packageName)
      ) {
        return;
      }
      state.importedPackageName = sourceName;
      path.get('specifiers').forEach(specifier => {
        const localPath = specifier.get('local');
        const localName = localPath.node.name;
        const refPaths = localPath.scope.bindings[localName].referencePaths;
        if (t.isImportSpecifier(specifier)) {
          // import {moduleName} from 'packageName';
          const specifierName = specifier.get('imported').node.name;
          if (compareToModuleName(specifierName)) {
            refsHandler(t, state, refPaths, specifierName);
          }
        } else if (t.isImportNamespaceSpecifier(specifier)) {
          // import * as pkg from 'packageName';
          // TODO(#5): Handle this case, or issue a warning because this may not be 100% robust
        }
      });
    },
  };
}
