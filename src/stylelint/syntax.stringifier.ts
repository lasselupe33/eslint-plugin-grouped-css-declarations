import type { Builder, Root } from "postcss";

import { restoreExpressions } from "../rules/css/grouped-declarations/util.restore-expressions";

export function stringifier(root: Root, builder: Builder) {
  const restoredCss = restoreExpressions(root.toString())
    .replace(/\/\*___js___(.*?)\*\//g, (replaceable) => {
      const base64js = replaceable
        .replace(/^\/\*___js___/, "")
        .replace(/\*\/$/, "");

      return Buffer.from(base64js, "base64").toString("utf-8");
    })
    .replace(/\/\*___start___\*\/.class\d+?{/g, "css`")
    .replace("}/*___end___*/", "`");

  root.nodes.length = 1;

  builder(restoredCss, root.nodes[0]);
}
