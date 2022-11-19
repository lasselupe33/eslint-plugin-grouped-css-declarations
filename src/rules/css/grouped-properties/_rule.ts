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
  FIXABLE_REPORT = "fixable-report",
}

const createRule = RuleCreator(resolveDocsRoute);

/**
 * @TODO: Docs
 */
export const groupedPropertiesRule = createRule<Options, MessageIds>({
  name: "grouped-properties",
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
