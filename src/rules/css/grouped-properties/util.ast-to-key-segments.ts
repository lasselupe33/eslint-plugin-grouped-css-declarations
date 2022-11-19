import { AtRule, Root, Rule } from "postcss";

export function astToKeySegments(ast: Root | AtRule | Rule): string[] {
  const keySegments: string[] = [];

  for (const child of ast.nodes) {
    switch (child.type) {
      case "comment":
        keySegments.push(`comment-${child.text}-${child.raws.before}`);
        break;

      case "decl":
        keySegments.push(
          `decl-${child.prop}-${child.value}-${child.raws.before}`
        );
        break;

      case "rule":
      case "atrule":
        keySegments.push(`${child.type}-${child.raws.before}--`);
        keySegments.push(...astToKeySegments(child));
        break;
    }
  }

  return keySegments;
}
