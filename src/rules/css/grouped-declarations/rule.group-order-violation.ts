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
  let prevGroupOrderIdent:
    | "comment-group"
    | "unordered-group"
    | "ordered-group"
    | undefined = undefined;
  let prevGroupOrderIndex = -1;

  for (let i = 0; i < scope.groups.length; i++) {
    const declarationGroup = scope.groups[i];

    // In case the current declaration includes a comment, then it is always
    // consider 'valid' as they break out of default violation checking.
    if (!declarationGroup) {
      continue;
    }

    let relevantGroupOrderIndex = defaultOrder.findIndex(
      findGroupOrderForProperty(declarationGroup.declarations[0]?.prop)
    );

    if (relevantGroupOrderIndex === -1 || declarationGroup.comment) {
      relevantGroupOrderIndex = 9999;
    }

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
          data: {
            currentGroup: defaultOrder[relevantGroupOrderIndex],
            currentGroupIndex: relevantGroupOrderIndex,
            prevGroup: defaultOrder[prevGroupOrderIndex] ?? prevGroupOrderIdent,
            prevGroupIndex: prevGroupOrderIndex,
          },
        });
      }
    }

    prevGroupOrderIndex = Math.max(
      relevantGroupOrderIndex,
      prevGroupOrderIndex
    );
    prevGroupOrderIdent = declarationGroup.comment
      ? "comment-group"
      : relevantGroupOrderIndex === 9999
      ? "unordered-group"
      : "ordered-group";
  }
}
