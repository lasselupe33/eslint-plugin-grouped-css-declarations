import { AtRule, Comment, Declaration, Root, Rule } from "postcss";

export type DeclarationScope = {
  container?: Rule | AtRule;
  groups: DeclarationGroup[];
  scopes: DeclarationScope[];
};

export type DeclarationGroup = {
  comment?: Comment;
  declarations: Declaration[];
};

/**
 * @TODO: Cleanup :))
 */
export function extractDeclarationScope(
  root: Root | AtRule | Rule
): DeclarationScope {
  const scopedDeclarations: DeclarationScope = {
    container:
      root.type === "atrule" || root.type === "rule" ? root : undefined,
    groups: [],
    scopes: [],
  };
  let currentDeclarationGroup: DeclarationGroup = {
    declarations: [],
  };

  for (let i = 0; i < root.nodes.length; i++) {
    const currentNode = root.nodes[i];

    switch (currentNode?.type) {
      case "decl": {
        const prevDeclaration = currentDeclarationGroup.declarations.at(-1);

        if (
          prevDeclaration?.source?.end &&
          currentNode.source?.start &&
          prevDeclaration.source.end.line < currentNode.source.start.line - 1
        ) {
          scopedDeclarations.groups.push(currentDeclarationGroup);
          currentDeclarationGroup = {
            declarations: [],
          };
        }

        currentDeclarationGroup.declarations.push(currentNode);
        break;
      }

      case "comment":
        if (currentDeclarationGroup.declarations.length > 0) {
          scopedDeclarations.groups.push(currentDeclarationGroup);
          currentDeclarationGroup = {
            comment: currentNode,
            declarations: [],
          };
        } else {
          currentDeclarationGroup.comment = currentNode;
        }
        break;

      case "rule": {
        if (currentDeclarationGroup.declarations.length > 0) {
          scopedDeclarations.groups.push(currentDeclarationGroup);

          currentDeclarationGroup = {
            declarations: [],
          };
        }

        const ruleDeclarationGroups = extractDeclarationScope(currentNode);
        scopedDeclarations.scopes.push(ruleDeclarationGroups);

        break;
      }

      case "atrule": {
        if (currentDeclarationGroup.declarations.length > 0) {
          scopedDeclarations.groups.push(currentDeclarationGroup);

          currentDeclarationGroup = {
            declarations: [],
          };
        }

        const ruleDeclarationGroups = extractDeclarationScope(currentNode);
        scopedDeclarations.scopes.push(ruleDeclarationGroups);
      }
    }
  }

  if (currentDeclarationGroup.declarations.length > 0) {
    scopedDeclarations.groups.push(currentDeclarationGroup);
  }

  return scopedDeclarations;
}
