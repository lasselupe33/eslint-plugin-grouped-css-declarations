import { AtRule, Root, Rule } from "postcss";

export function restoreCustomProps(ast: Root | AtRule | Rule) {
  for (const child of ast.nodes) {
    switch (child.type) {
      case "decl":
        child.prop = child.prop.replace(/custom-prop__(.*?)__/g, "${$1}");
        child.value = child.value.replace(/custom-prop__(.*?)__/g, "${$1}");
        break;

      case "rule":
        child.selector = child.selector.replace(
          /custom-prop__(.*?)__/g,
          "${$1}"
        );
        restoreCustomProps(child);
        break;

      case "atrule":
        child.params = child.params.replace(/custom-prop__(.*?)__/g, "${$1}");
        restoreCustomProps(child);
        break;
    }
  }
}
