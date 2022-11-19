import { TaggedTemplateExpression } from "@typescript-eslint/types/dist/generated/ast-spec";
import { RuleCreator } from "@typescript-eslint/utils/dist/eslint-utils";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";
import rootPostcss, {
  AtRule,
  ChildNode,
  Comment,
  Declaration,
  Root,
  Rule,
} from "postcss";

import { resolveDocsRoute } from "../../../utils";
import { isIdentifier } from "../../../utils/ast/guards";

import { defaultOrder, GroupOrder } from "./order";

const postcss = rootPostcss();

type Options = [];

export enum MessageIds {
  INVALID_GROUP_ORDER = "invalid-group-order",
  INVALID_DECLARATION_ORDER = "invalid-declaration-order",
  FIXABLE_REPORT = "fixable-report",
}

const createRule = RuleCreator(resolveDocsRoute);

/**
 * @TODO: Docs
 */
export const groupedPropertiesRule = createRule<Options, MessageIds>({
  name: "no-relative-internals",
  defaultOptions: [],
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      [MessageIds.INVALID_GROUP_ORDER]: `Oh no, do not do this`,
      [MessageIds.INVALID_DECLARATION_ORDER]: "Oh no prop",
      [MessageIds.FIXABLE_REPORT]: "Use me to fix",
    },
    docs: {
      description: " ergergerg erg gre",
      recommended: "error",
    },
    hasSuggestions: true,
    schema: [],
  },
  create: (context) => {
    const sourceCode = context.getSourceCode();

    return {
      TaggedTemplateExpression: (node) => {
        // Bail out early in case we're not considering a @linaria/core css
        // literal
        if (!isIdentifier(node.tag) || node.tag.name !== "css") {
          return;
        }

        let cssString = "";

        for (let i = 0; i < node.quasi.quasis.length; i++) {
          cssString += node.quasi.quasis[i]?.value.cooked;

          const nextExpression = node.quasi.expressions[i];

          if (nextExpression) {
            cssString += `custom-prop__${sourceCode.getText(nextExpression)}__`;
          }
        }

        try {
          const cssAST = postcss.process(cssString).root;
          const orginalKey = astToKeySegments(cssAST).join("");

          const declarationRootScope = extractDeclarationScope(cssAST);
          analyzeDeclarationScopes(context, node, declarationRootScope);

          const fixedAst = rewriteAndFixAst(cssAST, declarationRootScope);
          const fixedKey = astToKeySegments(fixedAst).join("");

          if (orginalKey !== fixedKey) {
            context.report({
              node: node.tag,
              messageId: MessageIds.FIXABLE_REPORT,
              fix(fixer) {
                restoreCustomProps(fixedAst);

                return fixer.replaceText(
                  node.quasi,
                  `\`${fixedAst.toString()}\``
                );
              },
            });
          }
        } catch {
          // no-op
        }
      },
    };
  },
});

type DeclarationScope = {
  container?: Rule | AtRule;
  groups: DeclarationGroup[];
  scopes: DeclarationScope[];
};

type DeclarationGroup = {
  comment?: Comment;
  declarations: Declaration[];
};

/**
 * @TODO: Cleanup :))
 */
function extractDeclarationScope(root: Root | AtRule | Rule): DeclarationScope {
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

function analyzeDeclarationScopes(
  context: RuleContext<MessageIds, Options>,
  node: TaggedTemplateExpression,
  declarationScope: DeclarationScope
): boolean {
  let didViolate = false;

  function analyzeDeclarationScope(scope: DeclarationScope) {
    let prevOrderIndex = -1;

    for (let i = 0; i < scope.groups.length; i++) {
      const declarationGroup = scope.groups[i];

      if (!declarationGroup || declarationGroup.comment) {
        continue;
      }

      const relevantOrderIndex = defaultOrder.findIndex((groupOrder) =>
        groupOrder.some((property) =>
          declarationGroup.declarations[0]?.prop.startsWith(property)
        )
      );
      const relevantOrder = defaultOrder[relevantOrderIndex];

      // Report group violation
      if (
        relevantOrderIndex < prevOrderIndex &&
        i !== scope.groups.length - 1
      ) {
        didViolate = true;

        const firstDeclaration = declarationGroup.declarations[0];
        const lastDeclaration = declarationGroup.declarations.at(-1);

        if (firstDeclaration?.source?.start && lastDeclaration?.source?.end) {
          context.report({
            loc: {
              start: {
                column: firstDeclaration.source.start.column - 1,
                line:
                  node.loc.start.line - 1 + firstDeclaration.source.start.line,
              },
              end: {
                column: lastDeclaration.source.end.column - 1,
                line: node.loc.start.line - 1 + lastDeclaration.source.end.line,
              },
            },
            messageId: MessageIds.INVALID_GROUP_ORDER,
          });
        }
      }

      if (!relevantOrder) {
        continue;
      }

      const violations = getViolatingDeclarations(
        relevantOrder,
        declarationGroup
      );

      prevOrderIndex = Math.max(prevOrderIndex, relevantOrderIndex);

      // Report ALL violations such that the developer may know exactly
      // what properties aren't grouped properly
      for (const violation of violations) {
        didViolate = true;

        if (violation.source?.start && violation.source.end) {
          context.report({
            loc: {
              start: {
                column: violation.source.start.column - 1,
                line: node.loc.start.line - 1 + violation.source.start.line,
              },
              end: {
                column: violation.source.end.column - 1,
                line: node.loc.start.line - 1 + violation.source.end.line,
              },
            },
            messageId: MessageIds.INVALID_DECLARATION_ORDER,
          });
        }
      }
    }

    for (const nestedScope of scope.scopes) {
      analyzeDeclarationScope(nestedScope);
    }
  }

  analyzeDeclarationScope(declarationScope);

  return didViolate;
}

function getViolatingDeclarations(
  order: GroupOrder,
  group: DeclarationGroup
): Declaration[] {
  if (group.comment) {
    return [];
  }

  const violations: Declaration[] = [];
  let lastSeenIndex = -1;

  for (const declaration of group.declarations) {
    const indexOf =
      order.findIndex((it) => declaration.prop.startsWith(it)) ?? lastSeenIndex;

    if (indexOf < lastSeenIndex) {
      violations.push(declaration);
    }

    lastSeenIndex = Math.max(lastSeenIndex, indexOf);
  }

  return violations;
}

function rewriteAndFixAst(
  cssAST: Root,
  declarationRootScope: DeclarationScope
): Root {
  const clonedAst = cssAST.clone();
  clonedAst.nodes = [];

  function applyDeclarationScope(
    scope: DeclarationScope,
    rootNode: Root | Rule | AtRule
  ) {
    if (scope.container) {
      scope.container.nodes = [];
      rootNode.push(scope.container);
    }

    const groups = constructCorrectGroups(scope.groups);
    const relevantNodeArray = scope.container
      ? scope.container.nodes
      : rootNode.nodes;

    for (const declarationGroup of groups) {
      if (declarationGroup.comment) {
        relevantNodeArray.push(declarationGroup.comment);
      }

      for (let i = 0; i < declarationGroup.declarations.length; i++) {
        const declaration = declarationGroup.declarations[i];

        if (!declaration) {
          continue;
        }

        declaration.raws = {
          before: `${"\n".repeat(
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
      const finalNode = relevantNodeArray[relevantNodeArray.length];

      if (finalNode) {
        finalNode.raws = { before: "\n\n" };
      }
    }

    for (const nestedScope of scope.scopes) {
      applyDeclarationScope(nestedScope, scope.container ?? clonedAst);
    }
  }

  applyDeclarationScope(declarationRootScope, clonedAst);

  return clonedAst;
}

function constructCorrectGroups(
  originalGroups: DeclarationGroup[]
): DeclarationGroup[] {
  const sortedGroups: DeclarationGroup[] = new Array(defaultOrder.length + 1)
    .fill(undefined)
    .map(() => ({ declarations: [] }));

  for (const declarationGroup of originalGroups) {
    if (declarationGroup.comment) {
      sortedGroups.push(declarationGroup);
      continue;
    }

    for (const declaration of declarationGroup.declarations) {
      const relevantGroupIndex = defaultOrder.findIndex((group) =>
        group.some((property) => declaration.prop.startsWith(property))
      );

      if (relevantGroupIndex === -1) {
        sortedGroups[defaultOrder.length]?.declarations.push(declaration);
      } else {
        sortedGroups[relevantGroupIndex]?.declarations.push(declaration);
      }
    }
  }

  for (let i = 0; i < defaultOrder.length; i++) {
    const order = defaultOrder[i];
    const group = sortedGroups[i];

    if (group && order) {
      group.declarations = orderGroup(order, group.declarations);
    }
  }

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

function astToKeySegments(ast: Root | AtRule | Rule): string[] {
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

function restoreCustomProps(ast: Root | AtRule | Rule) {
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
