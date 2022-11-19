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
  ["custom-prop", "--"],
  ["position", "top", "left", "right", "bottom", "z-index"],
  ["margin", "padding"],
  [
    "box-sizing",
    "max-height",
    "max-width",
    "height",
    "width",
    "min-height",
    "min-width",
  ],
  ["appearance", "border", "background"],
  ["overflow", "text-overflow", "white-space"],
  [
    "display",
    "grid",
    "flex",
    "justify-self",
    "justify-content",
    "justify-items",
    "align-self",
    "align-content",
    "align-items",
    "gap",
    "text-align",
  ],
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
  ],
  ["cursor", "outline"],
  ["opacity", "transform", "transition"],
];
