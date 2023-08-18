import rootPostcss, { ProcessOptions } from "postcss";

import { stringifyExpressions } from "../rules/css/grouped-declarations/util.stringify-expressions";
const postcss = rootPostcss();

export function parser(content: string, opts: ProcessOptions) {
  const css = (() => {
    if (opts.from?.endsWith(".css")) {
      return content;
    }

    return extractInlineCss(content);
  })();

  const { quasis, expressions } = extractQuasisAndExpressions(css);

  const safeCssString = stringifyExpressions(quasis, expressions);

  return postcss.process(safeCssString, { from: opts.from, to: opts.to }).root;
}

let cssInJSOccurrence = 0;

function extractInlineCss(content: string): string {
  const surrounding = [] as Array<string>;
  const css = [] as string[];

  let current = "";
  let extractingCss = false;

  for (let cursor = 0; cursor < content.length; cursor++) {
    const currentChar = content[cursor];

    if (
      !extractingCss &&
      currentChar === "c" &&
      content.slice(cursor, cursor + 4) === "css`"
    ) {
      extractingCss = true;

      surrounding.push(
        `/*___js___${Buffer.from(current).toString("base64")}*/`,
      );
      current = "";

      cursor += 3;
      continue;
    }

    if (extractingCss && currentChar === "`") {
      extractingCss = false;

      css.push(
        `/*___start___*/.class${cssInJSOccurrence++}{${current}}/*___end___*/`,
      );
      current = "";
      continue;
    }

    current += content[cursor];
  }

  surrounding.push(`/*___js___${Buffer.from(current).toString("base64")}*/`);

  let cssString = "";

  for (let i = 0; i < surrounding.length; i++) {
    const currJS = surrounding[i];
    const nextCss = css[i];

    if (!currJS) {
      continue;
    }

    cssString += currJS;

    if (nextCss) {
      cssString += nextCss;
    }
  }

  return cssString;
}

function extractQuasisAndExpressions(css: string): {
  quasis: Array<{ value: { cooked: string } }>;
  expressions: string[];
} {
  const quasis = [] as Array<{ value: { cooked: string } }>;
  const expressions = [] as string[];

  let current = "";
  let indentation = 0;

  for (let cursor = 0; cursor < css.length; cursor++) {
    const currentChar = css[cursor];
    const nextChar = css[cursor + 1];

    if (!indentation && currentChar === "$" && nextChar === "{") {
      indentation++;

      quasis.push({ value: { cooked: current } });
      current = "";

      cursor += 1;
      continue;
    }

    if (indentation && currentChar === "{") {
      indentation++;
    }

    if (indentation && currentChar === "}") {
      indentation--;

      if (indentation === 0) {
        expressions.push(current);
        current = "";
        continue;
      }
    }

    current += css[cursor];
  }

  quasis.push({ value: { cooked: current } });

  return { quasis, expressions };
}
