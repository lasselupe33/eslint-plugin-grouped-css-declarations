import { AtRule, Declaration, Root, Rule } from "postcss";

import { defaultOrder, GroupOrder } from "./config.order";
import {
  DeclarationGroup,
  DeclarationScope,
} from "./util.extract-declaration-scopes";
import {
  findGroupOrderForProperty,
  findPropertyIndexInGroupOrder,
} from "./util.find-group-order-for-property";

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
    if (scope.comment) {
      const newLines = rootNode.nodes.length === 0 ? 1 : 2;
      scope.comment.raws = {
        ...scope.comment.raws,
        before: `${"\n".repeat(newLines)}${" ".repeat(
          scope.comment.raws.before?.replace(/\n/g, "").length ?? 0
        )}`,
      };

      rootNode.push(scope.comment);
    }

    if (scope.container) {
      const newLines = rootNode.nodes.length === 0 || scope.comment ? 1 : 2;
      scope.container.raws = {
        ...scope.container.raws,
        before: `${"\n".repeat(newLines)}${" ".repeat(
          scope.container.raws.before?.replace(/\n/g, "").length ?? 0
        )}`,
      };

      scope.container.nodes = [];
      rootNode.push(scope.container);
    }

    const orderedGroups = constructOrderedGroups(scope.groups);

    const relevantNodeArray = scope.container
      ? scope.container.nodes
      : rootNode.nodes;

    for (const declarationGroup of orderedGroups) {
      if (declarationGroup.comment) {
        const newLines = relevantNodeArray.length === 0 ? 1 : 2;
        declarationGroup.comment.raws = {
          ...declarationGroup.comment.raws,
          before: `${"\n".repeat(newLines)}${" ".repeat(
            declarationGroup.comment.raws.before?.replace(/\n/g, "").length ?? 0
          )}`,
        };

        relevantNodeArray.push(declarationGroup.comment);
      }

      for (let i = 0; i < declarationGroup.declarations.length; i++) {
        const declaration = declarationGroup.declarations[i];

        if (!declaration) {
          continue;
        }

        declaration.raws = {
          ...declaration.raws,
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
            declaration.raws.before?.replace(/[^ ]/g, "").length ?? 0
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
    const aOrder = findPropertyIndexInGroupOrder(order, a.prop) ?? -1;
    const bOrder = findPropertyIndexInGroupOrder(order, b.prop) ?? -1;

    const aValueIsCustomProp =
      a.value === a.value.match(/custom-prop__(.*?)__/)?.[0];
    const bValueIsCustomProp =
      b.value === b.value.match(/custom-prop__(.*?)__/)?.[0];

    // In case any values in the group contains JS properties, then ensure to
    // put these first, ensuring that subsequent declarations can overwrite
    // values from the customly inserted JS, if required.
    if (aValueIsCustomProp && !bValueIsCustomProp) {
      return -1;
    } else if (!aValueIsCustomProp && bValueIsCustomProp) {
      return 1;
    }

    return aOrder - bOrder;
  });
}
