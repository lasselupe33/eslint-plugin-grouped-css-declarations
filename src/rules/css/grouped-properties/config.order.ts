import { StandardProperties } from "csstype";

type Kebab<
  T extends string,
  A extends string = ""
> = T extends `${infer F}${infer R}`
  ? Kebab<R, `${A}${F extends Lowercase<F> ? "" : "-"}${Lowercase<F>}`>
  : A;

export type GroupOrder = (
  | `${Kebab<keyof StandardProperties>}`
  | "custom-prop"
  | "--"
)[];
export type Order = GroupOrder[];

export const defaultOrder: Order = [
  // Variables/CSS-in-JS
  ["custom-prop", "--"],

  // pseudo-elements
  ["content"],

  // Positioning
  ["position", "inset", "top", "left", "right", "bottom", "z-index"],

  // Boundaries
  ["margin", "padding"],

  // Dimensioning
  [
    "box-sizing",
    "max-height",
    "max-width",
    "height",
    "width",
    "min-height",
    "min-width",
  ],

  // Box appearance
  ["appearance", "box-shadow", "border", "background"],
  [
    "overflow",
    "text-overflow",
    "white-space",
    "word-break",
    "word-wrap",
    "overscroll-behavior",
  ],

  // Child positioning
  [
    "display",
    "direction",
    "grid",
    "flex",
    "order",
    "justify-self",
    "justify-content",
    "justify-items",
    "align-self",
    "align-content",
    "align-items",
    "columns",
    "column-count",
    "column-fill",
    "column-rule",
    "column-gap",
    "column-span",
    "column-width",
    "gap",
    "list-style",
    "text-align",
  ],

  // Font appearance
  [
    "color",
    "font-family",
    "font-weight",
    "font-size",
    "font-style",
    "font",
    "line-height",
    "letter-spacing",
    "text-decoration",
    "text-transform",
    "text-shadow",
  ],

  // Interactions
  ["cursor", "outline"],

  // Transitions
  ["opacity", "transform", "transition", "animation"],
];
