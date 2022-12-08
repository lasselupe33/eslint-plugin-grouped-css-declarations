import { Node } from "@typescript-eslint/types/dist/generated/ast-spec";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";
import { Declaration } from "postcss";

import { MessageIds, Options } from "./_rule";
import { defaultOrder, GroupOrder } from "./config.order";
import {
  DeclarationGroup,
  DeclarationScope,
} from "./util.extract-declaration-scopes";
import {
  findGroupOrderForProperty,
  findPropertyIndexInGroupOrder,
} from "./util.find-group-order-for-property";
import { getDeclarationPosition } from "./util.get-declaration-position";

/**
 * Verifies all properties in a given scope and report any line that isn't in
 * the expected order.
 */
export function reportDeclarationOrderViolations(
  context: RuleContext<MessageIds, Options>,
  node: Node,
  scope: DeclarationScope
) {
  for (let i = 0; i < scope.groups.length; i++) {
    const declarationGroup = scope.groups[i];

    if (!declarationGroup || declarationGroup.comment) {
      continue;
    }

    // Extract the group ordering relevant for the current group, based on the
    // first property in the group.
    const relevantGroupOrder = defaultOrder.find(
      findGroupOrderForProperty(declarationGroup.declarations[0]?.prop)
    );

    if (!relevantGroupOrder) {
      continue;
    }

    const violations = getViolatingDeclarations(
      relevantGroupOrder,
      declarationGroup
    );

    // Report ALL violations such that the developer may know exactly
    // what properties aren't grouped properly
    for (const violation of violations) {
      const loc = getDeclarationPosition(node, violation);

      if (!loc) {
        continue;
      }

      const isInGroup = !!findPropertyIndexInGroupOrder(
        relevantGroupOrder,
        violation.prop
      );

      context.report({
        loc,
        messageId: isInGroup
          ? MessageIds.INVALID_DECLARATION_ORDER
          : MessageIds.INVALID_GROUPING,
        data: {
          property: violation.prop,
          order: relevantGroupOrder,
        },
      });
    }
  }
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
      findPropertyIndexInGroupOrder(order, declaration.prop) ?? -1;

    if (indexOf < lastSeenIndex) {
      violations.push(declaration);
    }

    lastSeenIndex = Math.max(lastSeenIndex, indexOf);
  }

  return violations;
}
