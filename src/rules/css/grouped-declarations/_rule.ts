import { RuleCreator } from "@typescript-eslint/utils/dist/eslint-utils";
import rootPostcss from "postcss";

import { resolveDocsRoute } from "../../../utils";
import { isIdentifier } from "../../../utils/ast/guards";

import { rewriteToExpectedAST } from "./fixer.rewrite-to-expected-ast";
import { astToKeySegments } from "./util.ast-to-key-segments";
import { makeDeclarationScopeAnalyzer } from "./util.declaration-scope-analyzer";
import { extractDeclarationScope } from "./util.extract-declaration-scopes";
import { restoreCustomProps } from "./util.restore-custom-props";

const postcss = rootPostcss();

export type Options = [];

export enum MessageIds {
  INVALID_GROUP_ORDER = "invalid-group-order",
  INVALID_DECLARATION_ORDER = "invalid-declaration-order",
  INVALID_GROUPING = "invalid-grouping",
  FIXABLE_REPORT = "fixable-report",
}

const createRule = RuleCreator(resolveDocsRoute);

/**
 * Identifies @linaria/core CSS-in-JS tags and ensures that a standardised
 * grouping of declarations is enforced. A "group" is identified as a logical
 * set of declarations separated by either an empty line or a comment.
 *
 * Issues will, whereever possible, be reported inline at violating CSS lines
 * to allow developers to easily digest issues. However, in some cases such
 * reports have not been implemented.
 *
 * In practice the reports exist simply to improve DX-experience. The actual
 * auto-fix relies upon comparing the original AST with an AST that fully
 * respects the configured ordering, prioritised as follows:
 *
 * 1) Declaration grouping will be considered in scopes. AtRule and Rule
 * creates new scopes.
 *
 * 2) The root scope will be positioned before other scopes. Then Rule scopes
 * will follow and finally AtRules.
 *
 * 3) Inside each scope declarations will be sorted based on the provided
 * grouping.
 *
 * 4) In case a group of declarations begins with a comment, then these will be
 * taken out of the ordering flow and positioned at the end of the scope.
 * Ordering will not be performed for this group.
 *
 * 5) If a declaration does not match any provided grouping then it will be
 * added to a final group after all other groups. Inside declarations will be
 * sorted alphabetically.
 */
export const groupedDeclarationsRule = createRule<Options, MessageIds>({
  name: "grouped-declarations",
  defaultOptions: [],
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      [MessageIds.INVALID_GROUP_ORDER]: `"{{currentGroup}}" (priority {{currentGroupIndex}}) should be placed before "{{prevGroup}}" (priority {{prevGroupIndex}})`,
      [MessageIds.INVALID_DECLARATION_ORDER]: `"{{property}}" is not ordered correctly with respect to the ordering "{{order}}"`,
      [MessageIds.INVALID_GROUPING]: `"{{property}}" does not belong to the current group ordering "{{order}}"`,
      [MessageIds.FIXABLE_REPORT]:
        "Issues have been identified with the current CSS structuring, please use this error to automatically re-format",
    },
    docs: {
      description:
        "Identifies @linaria/core CSS-in-JS tags and ensures that a standardised grouping of declarations is enforced",
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
          const analyzeDeclarationScope = makeDeclarationScopeAnalyzer(
            context,
            node
          );
          analyzeDeclarationScope(declarationRootScope);

          const fixedAst = rewriteToExpectedAST(cssAST, declarationRootScope);
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
