import stylelint from "stylelint";

import { rewriteToExpectedAST } from "../rules/css/grouped-declarations/fixer.rewrite-to-expected-ast";
import { astToKeySegments } from "../rules/css/grouped-declarations/util.ast-to-key-segments";
import { extractDeclarationScope } from "../rules/css/grouped-declarations/util.extract-declaration-scopes";

const ruleName = "grouped-css-declarations/css";
const messages = stylelint.utils.ruleMessages(ruleName, {
  expected:
    "Issues have been identified with the current CSS structuring, please use the accompanying fix to automatically re-format",
});

const meta = {
  url: "https://github.com/foo-org/stylelint-foo/blob/main/src/rules/foo-bar/README.md",
};

const ruleFunction: stylelint.Rule = (primary, secondary, context) => {
  return (postcssRoot, postcssResult) => {
    const firstNode = postcssRoot.first;

    if (!firstNode) {
      return;
    }

    const orginalKey = astToKeySegments(postcssRoot).join("");

    const declarationRootScope = extractDeclarationScope(postcssRoot);

    const fixedAst = rewriteToExpectedAST(postcssRoot, declarationRootScope);

    // @ts-expect-error Stylelint wierdly computes that a newline exists before
    // the first node, even though this isn't true.
    fixedAst.nodes[0].raws.before = "";
    const fixedKey = astToKeySegments(fixedAst).join("");

    if (orginalKey !== fixedKey) {
      if (context.fix) {
        postcssRoot = fixedAst;
      } else {
        stylelint.utils.report({
          ruleName,
          result: postcssResult,
          message: messages.expected,
          node: postcssRoot,
        });
      }
    }
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
