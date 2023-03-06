import { GroupOrder } from "./config.order";

/**
 * Extracts the relevant group ordering for the current provided property.
 *
 * Do note that the first group order containing the provided property is
 * returned.
 *
 * Furthermore, an exact match isn't required, however, the provided prop need
 * not exactly match a given property in a groupOrder, it only needs to start
 * with the groupProp. e.g. "font-family" will match a group order which
 * contains the property "font"
 */
export function findGroupOrderForProperty(
  property: string | undefined
): (groupOrder: GroupOrder) => boolean {
  return (groupOrder) =>
    findPropertyIndexInGroupOrder(groupOrder, property) !== undefined;
}

export function findPropertyIndexInGroupOrder(
  order: GroupOrder,
  property: string | undefined
): number | undefined {
  let index = order.findIndex((groupProp) => groupProp === property);

  if (index === -1) {
    index = order.findIndex((groupProp) => property?.startsWith(groupProp));
  }

  if (index === -1) {
    return undefined;
  } else {
    return index;
  }
}
