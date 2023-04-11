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
  let index = order.findIndex(
    (groupProp) =>
      groupProp === property ||
      [`-webkit-${groupProp}`, `-moz-${groupProp}`].includes(property ?? "")
  );

  // If the index could not be resolved, then the current value may be an
  // expanded form of the properties already included in the order. Thus we must
  // search if this is the case.
  if (index === -1) {
    index = order.findIndex(
      (groupProp) =>
        property?.startsWith(groupProp) ||
        property?.startsWith(`-webkit-${groupProp}`) ||
        property?.startsWith(`-moz-${groupProp}`)
    );

    // In case we still haven't resolved the correct index after loosly matching
    // then bail out immediately
    if (index === -1) {
      return undefined;
    }

    // expanded properties should always be ordered above their shorthand
    // counterparts to avoid overriding due to CSS specificity. Thus we ensure
    // a slightly higher index for expanded properties.
    index *= 100;
    index += 1;
  } else {
    // and for direct matches (which may or may not be shorthand) we simply
    // multiply the index by a factor of two to avoid clashes with the shorthand
    // /expanded property fixing.
    index *= 100;
  }

  if (index === -1) {
    return undefined;
  } else {
    return index;
  }
}
