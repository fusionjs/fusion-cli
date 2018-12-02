/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const createModuleVisitor = require('../babel-plugin-utils/visit-named-module');

const PACKAGE_NAME = ['fusion-plugin-i18n-react', 'fusion-plugin-i18n-preact'];
const COMPONENT_IDENTIFIER = ['Translate', 'withTranslations'];

module.exports = i18nPlugin;

/*::
type PluginOpts = {translationIds: Set<string>}
*/

function i18nPlugin(babel /*: Object */, {translationIds} /*: PluginOpts */) {
  const t /*: Object */ = babel.types;
  const visitor = createModuleVisitor(
    t,
    COMPONENT_IDENTIFIER,
    PACKAGE_NAME,
    refsHandler
  );

  function refsHandler(t, context, refs = [], specifierName) {
    refs.forEach(refPath => {
      if (t.isCallExpression(refPath.parent)) {
        const firstArg = refPath.parent.arguments[0];
        if (specifierName === 'withTranslations') {
          const errorMessage =
            'The withTranslations hoc must be called with an array of string literal translation keys';
          if (!t.isArrayExpression(firstArg)) {
            throw refPath.buildCodeFrameError(errorMessage);
          }
          const elements = firstArg.elements;
          elements.forEach(element => {
            if (!t.isStringLiteral(element)) {
              throw refPath.buildCodeFrameError(errorMessage);
            }
            translationIds.add(element.value);
          });
          refPath.scope.path.traverse({
            CallExpression(callPath) {
              const {callee} = callPath.node;

              if (callee.name === 'translate' || (callee.property && callee.property.name === 'translate')) {

                const errorMessage = 'The translate function must be called with a string literal';

                const element = callPath.node.arguments[0];

                if (!t.isStringLiteral(element)) {
                  throw callPath.buildCodeFrameError(errorMessage);
                }

                translationIds.add(element.value);
                return;
              }
            }
          });
        }
        return;
      }
      if (!t.isJSXOpeningElement(refPath.parent)) {
        return;
      }
      refPath.parent.attributes.forEach(attr => {
        if (!t.isJSXAttribute(attr)) {
          return;
        }
        if (!t.isJSXIdentifier(attr.name)) {
          return;
        }
        if (!t.isStringLiteral(attr.value)) {
          return;
        }
        if (attr.name.name !== 'id') {
          return;
        }
        if (!t.isStringLiteral(attr.value)) {
          throw attr.buildCodeFrameError(
            'The translate component must have props.id be a string literal.'
          );
        }
        const translationKeyId = attr.value.value;
        translationIds.add(translationKeyId);
      });
    });
  }

  return {visitor};
}
