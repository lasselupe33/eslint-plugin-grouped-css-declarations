import { TSESTree } from "@typescript-eslint/utils";
import { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import { MessageIds, Options } from "./_rule";
import { reportDeclarationOrderViolations } from "./rule.declaration-order-violation";
import { reportGroupOrderViolations } from "./rule.group-order-violation";
import { DeclarationScope } from "./util.extract-declaration-scopes";

export function makeDeclarationScopeAnalyzer(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.TaggedTemplateExpression,
): (scope: DeclarationScope) => void {
  return function analyzeDeclarationScope(scope: DeclarationScope) {
    reportGroupOrderViolations(context, node, scope);
    reportDeclarationOrderViolations(context, node, scope);

    // Recursively analyze all nested scopes of the current scope
    for (const nestedScope of scope.scopes) {
      analyzeDeclarationScope(nestedScope);
    }
  };
}
