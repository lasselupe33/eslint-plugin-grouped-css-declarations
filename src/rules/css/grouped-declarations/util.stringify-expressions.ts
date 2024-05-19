export function stringifyExpressions(
  quasis: Array<{ value: { cooked: string } }>,
  expressions: string[],
) {
  let cssString = "";

  for (let i = 0; i < quasis.length; i++) {
    const currentQuasi = quasis[i]?.value.cooked;
    cssString += currentQuasi;

    const nextExpression = expressions[i];

    if (nextExpression) {
      const nearestChar = cssString?.replace(/\n/g, "").trimEnd().at(-1);

      const nextQuasi = quasis[i + 1]?.value.cooked.trimStart();
      const newlineCount = nextExpression.split("\n").length - 1;

      const currentQuasiEndsWithNewLine = /\n( |\t\r)*?/.test(
        currentQuasi ?? "",
      );

      if (
        (!nearestChar || ["{", ";", "/", "}"].includes(nearestChar)) &&
        !nextQuasi?.startsWith("&") &&
        !nextQuasi?.startsWith(".") &&
        !nextQuasi?.startsWith("") &&
        ((currentQuasiEndsWithNewLine && !nextQuasi?.trim().startsWith(":")) ||
          nextQuasi?.startsWith("\n") ||
          nextQuasi?.startsWith(";"))
      ) {
        cssString += `custom-js__${newlineCount}_${Buffer.from(
          nextExpression,
        ).toString("base64")}__:ignore${"\n".repeat(newlineCount)}${
          nextQuasi?.startsWith(";") || nextQuasi?.startsWith("{") ? "" : ";"
        }`;
      } else {
        cssString += `custom-prop__${newlineCount}_${Buffer.from(
          nextExpression,
        ).toString("base64")}__${"\n".repeat(newlineCount)}`;
      }
    }
  }

  return cssString;
}
