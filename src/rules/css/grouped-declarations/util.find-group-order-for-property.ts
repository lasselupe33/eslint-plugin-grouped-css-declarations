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
  return (groupOrder) => groupOrder.some(findPropertyInGroupOrder(property));
}

export function findPropertyInGroupOrder(
  property: string | undefined
): (groupProp: GroupOrder[number]) => boolean {
  return (groupProp) => property?.startsWith(groupProp) ?? false;
}
