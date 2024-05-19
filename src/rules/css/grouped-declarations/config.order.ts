import { StandardProperties } from "csstype";

type Kebab<
  T extends string,
  A extends string = "",
> = T extends `${infer F}${infer R}`
  ? Kebab<R, `${A}${F extends Lowercase<F> ? "" : "-"}${Lowercase<F>}`>
  : A;

export type GroupOrder = (
  | `${Kebab<keyof StandardProperties>}`
  | "custom-prop"
  | "custom-js"
  | "--"
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {})
)[];
export type Order = GroupOrder[];

export const defaultOrder: Order = [
  // Variables/CSS-in-JS
  ["custom-js", "custom-prop", "--"],

  // pseudo-elements
  ["content"],

  // resets,
  [
    "all",
    "appearance",
    "isolation",
    "counter-increment",
    "counter-reset",
    "counter-set",
  ],

  // Positioning
  ["position", "inset", "top", "left", "right", "bottom", "z-index"],

  // Boundaries
  [
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
  ],

  // Dimensioning
  [
    "box-sizing",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "height",
    "block-size",
    "width",
    "inline-size",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "aspect-ratio",
  ],

  // Box appearance
  [
    "visibility",
    "box-shadow",
    "background",
    "border",
    "backdrop-filter",
    "clip",
    "clip-path",
    "filter",
    "mix-blend-mode",
    "backface-visibility",
    "quotes",
    "mask",
  ],

  // Scroll handling
  ["scroll", "scrollbar"],

  // Overflow handling
  [
    "overflow",
    "overscroll-behavior",
    "text-overflow",
    "hyphens",
    "hyphenate-character",
    "white-space",
    "word-break",
    "word-wrap",
    "box-decoration-break",
    "page-break",
    "break",
  ],

  // Child positioning
  [
    "display",
    "direction",
    "grid",
    "flex",
    "order",
    "float",
    "table-layout",
    "justify-self",
    "justify-content",
    "justify-items",
    "align-self",
    "align-content",
    "align-items",
    "place-content",
    "place-items",
    "place-self",
    "columns",
    "column-count",
    "column-fill",
    "column-rule",
    "column-gap",
    "column-span",
    "column-width",
    "orphans",
    "widows",
    "gap",
    "row-gap",
    "column-gap",
    "writing-mode",
    "list-style",
    "text-align",
  ],

  // media
  ["object-fit", "object-position"],

  // Font appearance
  [
    "font",
    "font-family",
    "font-weight",
    "font-size",
    "font-style",
    "line-height",
    "word-spacing",
    "letter-spacing",
    "text-decoration",
    "text-underline",
    "text-transform",
    "text-shadow",
    "text-emphasis",
    "text-justify",
    "color",
    "accent-color",
    "caret-color",
    "text-wrap",
  ],

  // Interactions
  ["cursor", "outline", "user-select", "pointer-events", "resize"],

  // Transitions
  [
    "opacity",
    "transform",
    "scale",
    "translate",
    "rotate",
    "perspective",
    "transition",
    "animation",
    "offset",
  ],
];
