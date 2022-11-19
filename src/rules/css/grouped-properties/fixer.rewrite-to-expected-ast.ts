import { AtRule, Declaration, Root, Rule } from "postcss";

import { defaultOrder, GroupOrder } from "./config.order";
import {
  DeclarationGroup,
  DeclarationScope,
} from "./util.extract-declaration-scopes";
import { findGroupOrderForProperty } from "./util.find-group-order-for-property";

export function rewriteToExpectedAST(
  cssAST: Root,
  declarationRootScope: DeclarationScope
): Root {
  const clonedAst = cssAST.clone();
  clonedAst.nodes = [];
  insertDeclarationScopeToAST(declarationRootScope, clonedAst);

  function insertDeclarationScopeToAST(
    scope: DeclarationScope,
    rootNode: Root | Rule | AtRule
  ) {
    if (scope.container) {
      scope.container.nodes = [];
      rootNode.push(scope.container);
    }

    const orderedGroups = constructOrderedGroups(scope.groups);

    const relevantNodeArray = scope.container
      ? scope.container.nodes
      : rootNode.nodes;

    for (const declarationGroup of orderedGroups) {
      if (declarationGroup.comment) {
        declarationGroup.comment.raws = {
          before: "\n\n",
        };
        relevantNodeArray.push(declarationGroup.comment);
      }

      for (let i = 0; i < declarationGroup.declarations.length; i++) {
        const declaration = declarationGroup.declarations[i];

        if (!declaration) {
          continue;
        }

        declaration.raws = {
          before: `${"\n".repeat(
            // The first declaration may have an additional line-break to
            // separate it from the previous group.
            // However, if the current declaration has a comment, then it should
            // just have one line-break as normally.
            i === 0 &&
              relevantNodeArray.length !== 0 &&
              !declarationGroup.comment
              ? 2
              : 1
          )}${" ".repeat(
            declaration.raws.before?.replace(/\n/g, "").length ?? 0
          )}`,
        };
      }

      relevantNodeArray.push(...declarationGroup.declarations);
    }

    // Recursively add all nested scopes to the current parent
    for (const nestedScope of scope.scopes) {
      insertDeclarationScopeToAST(nestedScope, scope.container ?? clonedAst);
    }
  }

  return clonedAst;
}

function constructOrderedGroups(
  originalGroups: DeclarationGroup[]
): DeclarationGroup[] {
  const sortedGroups: DeclarationGroup[] = new Array(defaultOrder.length + 1)
    .fill(undefined)
    .map(() => ({ declarations: [] }));

  for (const declarationGroup of originalGroups) {
    // Groups containing a group should always positioned last in the current
    // declaration scope.
    if (declarationGroup.comment) {
      sortedGroups.push(declarationGroup);
      continue;
    }

    for (const declaration of declarationGroup.declarations) {
      // The current declaration should always go into the first group which
      // explictly contains it.
      const relevantGroupOrderIndex = defaultOrder.findIndex(
        findGroupOrderForProperty(declaration.prop)
      );

      if (relevantGroupOrderIndex === -1) {
        sortedGroups[defaultOrder.length]?.declarations.push(declaration);
      } else {
        sortedGroups[relevantGroupOrderIndex]?.declarations.push(declaration);
      }
    }
  }

  // Now that we've added all declarations to their relevant groups, then ensure
  // that each group is internally sorted based on the provided group order
  for (let i = 0; i < defaultOrder.length; i++) {
    const order = defaultOrder[i];
    const group = sortedGroups[i];

    if (group && order) {
      group.declarations = orderGroup(order, group.declarations);
    }
  }

  // The final group, which contains all non-matching properties, should be
  // sorted alphabetically.
  sortedGroups[defaultOrder.length]?.declarations.sort((a, b) =>
    a.prop.localeCompare(b.prop)
  );

  return sortedGroups.filter(
    (it): it is DeclarationGroup => it.declarations.length > 0
  );
}

function orderGroup(order: GroupOrder, group: Declaration[]): Declaration[] {
  return [...group].sort((a, b) => {
    const aOrder = order.findIndex((it) => a.prop.startsWith(it)) ?? -1;
    const bOrder = order.findIndex((it) => b.prop.startsWith(it)) ?? -1;

    return aOrder - bOrder;
  });
}
