import { AtRule, Comment, Declaration, Root, Rule } from "postcss";

export type DeclarationScope = {
  comments: Comment[];
  container?: Rule | AtRule;
  groups: DeclarationGroup[];
  scopes: DeclarationScope[];
};

export type DeclarationGroup = {
  comments: Comment[];
  declarations: Declaration[];
};

export function extractDeclarationScope(
  root: Root | AtRule | Rule,
  comments?: Comment[],
): DeclarationScope {
  root.nodes ??= [];

  let commentsForNextScope: Comment[] = [];
  const scopedDeclaration: DeclarationScope = {
    comments: comments ?? [],
    container:
      root.type === "atrule" || root.type === "rule" ? root : undefined,
    groups: [],
    scopes: [],
  };
  let currentDeclarationGroup: DeclarationGroup = {
    declarations: [],
    comments: [],
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
          scopedDeclaration.groups.push(currentDeclarationGroup);
          currentDeclarationGroup = {
            declarations: [],
            comments: [],
          };
        }

        currentDeclarationGroup.declarations.push(currentNode);
        break;
      }

      case "comment": {
        if (isNextLogicalNodeAScope(root, i)) {
          commentsForNextScope.push(currentNode);
        } else if (
          currentDeclarationGroup.declarations.length > 0 &&
          currentNode.raws.before?.includes("\n")
        ) {
          scopedDeclaration.groups.push(currentDeclarationGroup);
          currentDeclarationGroup = {
            comments: [currentNode],
            declarations: [],
          };
        } else {
          currentDeclarationGroup.comments.push(currentNode);
        }
        break;
      }

      case "rule": {
        if (currentDeclarationGroup.declarations.length > 0) {
          scopedDeclaration.groups.push(currentDeclarationGroup);

          currentDeclarationGroup = {
            declarations: [],
            comments: [],
          };
        }

        const ruleDeclarationGroups = extractDeclarationScope(
          currentNode,
          commentsForNextScope,
        );
        commentsForNextScope = [];
        scopedDeclaration.scopes.push(ruleDeclarationGroups);

        break;
      }

      case "atrule": {
        if (currentDeclarationGroup.declarations.length > 0) {
          scopedDeclaration.groups.push(currentDeclarationGroup);

          currentDeclarationGroup = {
            declarations: [],
            comments: [],
          };
        }

        const ruleDeclarationGroups = extractDeclarationScope(
          currentNode,
          commentsForNextScope,
        );
        commentsForNextScope = [];
        scopedDeclaration.scopes.push(ruleDeclarationGroups);
      }
    }
  }

  if (commentsForNextScope.length > 0) {
    scopedDeclaration.comments.push(...commentsForNextScope);
  }

  if (
    currentDeclarationGroup.declarations.length > 0 ||
    currentDeclarationGroup.comments.length > 0
  ) {
    scopedDeclaration.groups.push(currentDeclarationGroup);
  }

  return scopedDeclaration;
}

function isNextLogicalNodeAScope(
  root: Root | AtRule | Rule,
  startIndex: number,
): boolean {
  root.nodes ??= [];

  for (let i = startIndex + 1; i < root.nodes.length; i++) {
    const nextNode = root.nodes[i];

    if (!nextNode || nextNode.type === "atrule" || nextNode.type === "rule") {
      return true;
    }

    if (nextNode.type === "decl") {
      return false;
    }
  }

  return false;
}
