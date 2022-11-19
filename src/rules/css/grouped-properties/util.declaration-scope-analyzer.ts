import { TaggedTemplateExpression } from "@typescript-eslint/types/dist/generated/ast-spec";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";

import { MessageIds, Options } from "./_rule";
import { reportDeclarationOrderViolations } from "./rule.declaration-order-violation";
import { reportGroupOrderViolations } from "./rule.group-order-violation";
import { DeclarationScope } from "./util.extract-declaration-scopes";

export function makeDeclarationScopeAnalyzer(
  context: RuleContext<MessageIds, Options>,
  node: TaggedTemplateExpression
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
