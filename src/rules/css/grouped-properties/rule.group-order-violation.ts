import { Node } from "@typescript-eslint/types/dist/generated/ast-spec";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";

import { MessageIds, Options } from "./_rule";
import { defaultOrder } from "./config.order";
import { DeclarationScope } from "./util.extract-declaration-scopes";
import { findGroupOrderForProperty } from "./util.find-group-order-for-property";
import { getDeclarationPosition } from "./util.get-declaration-position";

/**
 * Verifies all groups in the provided declarationScope and raises errors for
 * all groups that are not in the expected order.
 */
export function reportGroupOrderViolations(
  context: RuleContext<MessageIds, Options>,
  node: Node,
  scope: DeclarationScope
) {
  const prevGroupOrderIndex = -1;

  for (let i = 0; i < scope.groups.length; i++) {
    const declarationGroup = scope.groups[i];

    // In case the current declaration includes a comment, then it is always
    // consider 'valid' as they break out of default violation checking.
    if (!declarationGroup || declarationGroup.comment) {
      continue;
    }

    const relevantGroupOrderIndex = defaultOrder.findIndex(
      findGroupOrderForProperty(declarationGroup.declarations[0]?.prop)
    );

    if (relevantGroupOrderIndex < prevGroupOrderIndex) {
      const firstDeclaration = declarationGroup.declarations[0];
      const lastDeclaration = declarationGroup.declarations.at(-1);

      const loc = getDeclarationPosition(
        node,
        firstDeclaration,
        lastDeclaration
      );

      if (loc) {
        context.report({
          loc,
          messageId: MessageIds.INVALID_GROUP_ORDER,
        });
      }
    }
  }
}
