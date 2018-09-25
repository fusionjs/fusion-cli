/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
/* global __webpack_public_path__ */

/*::
declare var __webpack_public_path__: string;

import type {
  Context,
  SSRBodyTemplate as SSRBodyTemplateService,
} from 'fusion-core';
*/

import {
  createPlugin,
  escape,
  consumeSanitizedHTML,
  CriticalChunkIdsToken,
  RoutePrefixToken,
} from 'fusion-core';

const SSRBodyTemplate = createPlugin({
  deps: {
    criticalChunkIds: CriticalChunkIdsToken.optional,
    routePrefix: RoutePrefixToken.optional,
  },
  provides: ({criticalChunkIds, routePrefix}) => {
    return ctx => {
      const {htmlAttrs, bodyAttrs, title, head, body} = ctx.template;
      const safeAttrs = Object.keys(htmlAttrs)
        .map(attrKey => {
          return ` ${escape(attrKey)}="${escape(htmlAttrs[attrKey])}"`;
        })
        .join('');

      const safeBodyAttrs = Object.keys(bodyAttrs)
        .map(attrKey => {
          return ` ${escape(attrKey)}="${escape(bodyAttrs[attrKey])}"`;
        })
        .join('');

      const safeTitle = escape(title);
      // $FlowFixMe
      const safeHead = head.map(consumeSanitizedHTML).join('');
      // $FlowFixMe
      const safeBody = body.map(consumeSanitizedHTML).join('');

      const coreGlobals = [
        `<script nonce="${ctx.nonce}">`,
        `window.performance && window.performance.mark && window.performance.mark('firstRenderStart');`,
        routePrefix && `__ROUTE_PREFIX__ = ${JSON.stringify(routePrefix)};`,
        `__FUSION_ASSET_PATH__ = ${JSON.stringify(__webpack_public_path__)};`, // consumed by fusion-clientries/client-entry
        `</script>`,
      ]
        .filter(Boolean)
        .join('');
      const chunkScripts = getChunkScripts(ctx);
      const bundleSplittingBootstrap = [coreGlobals, chunkScripts].join('');

      return [
        '<!doctype html>',
        `<html${safeAttrs}>`,
        `<head>`,
        `<meta charset="utf-8" />`,
        `<title>${safeTitle}</title>`,
        `${bundleSplittingBootstrap}${safeHead}`,
        `</head>`,
        `<body${safeBodyAttrs}>${ctx.rendered}${safeBody}</body>`,
        '</html>',
      ].join('');
    };
  },
});

export {SSRBodyTemplate};

function getUrls({chunkUrlMap}, chunks) {
  return [...new Set(chunks)].map(id => {
    let url = chunkUrlMap.get(id).get('es5');
    return {id, url};
  });
}

function getChunkScripts(ctx) {
  const sync = getUrls(ctx, ctx.syncChunks).map(({url}) => {
    // cross origin is needed to get meaningful errors in window.onerror
    const crossOrigin = url.startsWith('https://')
      ? ' crossorigin="anonymous"'
      : '';

    return `<script nonce="${
      ctx.nonce
    }" defer${crossOrigin} src="${url}"></script>`;
  });
  const preloaded = getUrls(
    ctx,
    ctx.preloadChunks.filter(item => !ctx.syncChunks.includes(item))
  ).map(({id, url}) => {
    // cross origin is needed to get meaningful errors in window.onerror
    const crossOrigin = url.startsWith('https://')
      ? ' crossorigin="anonymous"'
      : '';
    return `<script nonce="${
      ctx.nonce
    }" defer${crossOrigin} src="${url}"></script>`;
  });
  return [...preloaded, ...sync].join('');
}
