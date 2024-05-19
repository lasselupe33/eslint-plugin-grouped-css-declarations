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
  declarationRootScope: DeclarationScope,
): Root {
  const clonedAst = cssAST.clone();
  clonedAst.nodes = [];
  insertDeclarationScopeToAST(declarationRootScope, clonedAst);

  function insertDeclarationScopeToAST(
    scope: DeclarationScope,
    rootNode: Root | Rule | AtRule,
  ) {
    rootNode.nodes ??= [];

    for (let i = 0; i < scope.comments.length; i++) {
      const isFirstComment = i === 0;
      const comment = scope.comments[i];

      if (!comment) {
        continue;
      }

      if (isFirstComment) {
        const newLines = rootNode.nodes.length === 0 ? 1 : 2;

        comment.raws = {
          ...comment.raws,
          before: `${"\n".repeat(newLines)}${" ".repeat(
            comment.raws.before?.replace(/\n/g, "").length ?? 0,
          )}`,
        };
      }

      rootNode.push(comment);
    }

    if (scope.container) {
      const newLines =
        rootNode.nodes.length === 0 || scope.comments.length > 0 ? 1 : 2;
      scope.container.raws = {
        ...scope.container.raws,
        before: `${"\n".repeat(newLines)}${" ".repeat(
          scope.container.raws.before?.replace(/\n/g, "").length ?? 0,
        )}`,
      };

      scope.container.nodes = [];
      rootNode.push(scope.container);
    }

    const orderedGroups = constructOrderedGroups(scope.groups);

    // In case all groups (except css variables and CSS-in-JS statements)
    // contains at most one item, then groups should be collapsed.
    const collapseGroups = orderedGroups
      .slice(1)
      .reduce(
        (acc, curr) =>
          curr.declarations.length <= 1 && curr.comments.length === 0 && acc,
        true,
      );

    // In case we're collapsing groups, then CssInJs should be separate from
    // the rest of the content.
    let separatedCssInJS = !collapseGroups;

    const relevantNodeArray = scope.container
      ? scope.container.nodes ?? []
      : rootNode.nodes ?? [];

    for (
      let declarationGroupIndex = 0;
      declarationGroupIndex < orderedGroups.length;
      declarationGroupIndex++
    ) {
      const declarationGroup = orderedGroups[declarationGroupIndex];

      if (
        !declarationGroup ||
        (declarationGroup.comments.length === 0 &&
          declarationGroup.declarations.length === 0)
      ) {
        continue;
      }

      for (let i = 0; i < declarationGroup.comments.length; i++) {
        const isFirstComment = i === 0;
        const comment = declarationGroup.comments[i];

        if (!comment) {
          continue;
        }

        if (isFirstComment) {
          const newLines = relevantNodeArray.length === 0 ? 1 : 2;
          comment.raws = {
            ...comment.raws,
            before: `${"\n".repeat(newLines)}${" ".repeat(
              comment.raws.before?.replace(/\n/g, "").length ?? 0,
            )}`,
          };
        }

        relevantNodeArray.push(comment);
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
              declarationGroup.comments.length === 0 &&
              // if we should collapse groups, then no newline should be added
              // (except between normal props and css vars / css-in-js
              // statements)
              (!collapseGroups ||
                (declarationGroupIndex > 0 && !separatedCssInJS))
              ? 2
              : 1,
          )}${" ".repeat(
            declaration.raws.before?.replace(/[^ ]/g, "").length ?? 0,
          )}`,
        };
      }

      relevantNodeArray.push(...declarationGroup.declarations);

      if (declarationGroupIndex > 0) {
        separatedCssInJS = true;
      }
    }

    // Recursively add all nested scopes to the current parent
    for (const nestedScope of scope.scopes) {
      insertDeclarationScopeToAST(nestedScope, scope.container ?? clonedAst);
    }
  }

  return clonedAst;
}

function constructOrderedGroups(
  originalGroups: DeclarationGroup[],
): DeclarationGroup[] {
  const sortedGroups: DeclarationGroup[] = new Array(defaultOrder.length + 1)
    .fill(undefined)
    .map(() => ({ declarations: [], comments: [] }));

  for (const declarationGroup of originalGroups) {
    // Groups containing a group should always positioned last in the current
    // declaration scope.
    if (declarationGroup.comments.length > 0) {
      sortedGroups.push(declarationGroup);
      continue;
    }

    for (const declaration of declarationGroup.declarations) {
      // The current declaration should always go into the first group which
      // explictly contains it.
      const relevantGroupOrderIndex = defaultOrder.findIndex(
        findGroupOrderForProperty(declaration.prop),
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
    a.prop.localeCompare(b.prop),
  );

  return sortedGroups;
}

function orderGroup(order: GroupOrder, group: Declaration[]): Declaration[] {
  return [...group].sort((a, b) => {
    const aOrder = findPropertyIndexInGroupOrder(order, a.prop) ?? -1;
    const bOrder = findPropertyIndexInGroupOrder(order, b.prop) ?? -1;

    // const aValueIsCustomProp =
    //   a.value === a.value.match(/custom-prop__(.*?)__/)?.[0];
    // const bValueIsCustomProp =
    //   b.value === b.value.match(/custom-prop__(.*?)__/)?.[0];

    // // In case any values in the group contains JS properties, then ensure to
    // // put these first, ensuring that subsequent declarations can overwrite
    // // values from the customly inserted JS, if required.
    // if (aValueIsCustomProp && !bValueIsCustomProp) {
    //   return -1;
    // } else if (!aValueIsCustomProp && bValueIsCustomProp) {
    //   return 1;
    // }

    return aOrder - bOrder;
  });
}
