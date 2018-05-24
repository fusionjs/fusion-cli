/* eslint-env node */
module.exports = (babel, {target}) => {
  const {types: t} = babel;

  return {
    name: 'transform-tree-shake',
    visitor: {
      ImportDeclaration(path) {
        if (path.removed) {
          return;
        }
        let shakeTasks = [];
        const specifiers = path.get('specifiers');

        // Imports with no specifiers is probably specifically for side effects
        let shakeDeclaration = specifiers.length > 0;

        for (const specifier of specifiers) {
          let shakeSpecifier = true;

          const localPath = specifier.get('local');
          const localName = localPath.node.name;
          if (localName === 'React') {
            // TODO: don't hardcode identifier and/or improve compat with JSX transform
            shakeSpecifier = false;
            shakeDeclaration = false;
            break;
          }
          const binding = localPath.scope.bindings[localName];
          if (binding) {
            const refPaths = binding.referencePaths;
            for (const path of refPaths) {
              const task = getShakeTask(t, path, target);
              if (task) {
                shakeTasks.push(task);
              } else {
                shakeSpecifier = false;
                shakeDeclaration = false;
              }
            }
          } else {
            // If binding doesn't exist, then this is an indication the import was
            // added by a plugin (rather existing than the original source code)
            // To be conservative, don't shake in this case.
            shakeSpecifier = false;
            shakeDeclaration = false;
          }
          if (shakeSpecifier) {
            specifier.remove();
          }
        }

        if (shakeDeclaration) {
          path.remove();
        }
        shakeTasks.forEach(task => task());
      },
    },
  };
};

function isLiteralFalse(path) {
  const node = path.node;
  return node.type === 'BooleanLiteral' && node.value === false;
}

const inverseTargetMap = {
  node: '__BROWSER__',
  browser: '__NODE__',
};
function isCUPGlobalFalse(path, target) {
  const node = path.node;
  return node.type === 'Identifier' && node.name === inverseTargetMap[target];
}

function isFalse(path, target) {
  return isLiteralFalse(path) || isCUPGlobalFalse(path, target);
}

function getShakeTask(t, path, target) {
  while (path && !path.removed) {
    if (path.type === 'IfStatement') {
      if (isFalse(path.get('test'), target)) {
        return () => !path.removed && path.remove();
      }
    } else if (path.type === 'ConditionalExpression') {
      if (isFalse(path.get('test'), target)) {
        return () => !path.removed && path.replaceWith(path.get('alternate'));
      }
    }
    // traverse chained BooleanExpressions
    // to handle cases like: `false && unknown && to_be_shaken`
    let _path = path;
    while (_path) {
      if (
        _path.type === 'LogicalExpression' &&
        _path.get('operator').node === '&&'
      ) {
        _path = _path.get('left');
        if (isFalse(_path, target)) {
          return () =>
            !path.removed && path.replaceWith(t.booleanLiteral(false));
        }
      } else {
        break;
      }
    }

    path = path.parentPath;
  }
}
