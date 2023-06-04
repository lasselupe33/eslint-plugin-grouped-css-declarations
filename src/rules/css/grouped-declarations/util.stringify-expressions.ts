export function stringifyExpressions(
  quasis: Array<{ value: { cooked: string } }>,
  expressions: string[]
) {
  let cssString = "";

  for (let i = 0; i < quasis.length; i++) {
    const currentQuasi = quasis[i]?.value.cooked;
    cssString += currentQuasi;

    const nextExpression = expressions[i];

    if (nextExpression) {
      const nearestChar = cssString?.replace(/\n/g, "").trimEnd().at(-1);

      const nextQuasi = quasis[i + 1]?.value.cooked.trimStart();

      const currentQuasiEndsWithNewLine = /\n( |\t\r)*?/.test(
        currentQuasi ?? ""
      );

      if (
        (!nearestChar || ["{", ";", "/"].includes(nearestChar)) &&
        (currentQuasiEndsWithNewLine ||
          nextQuasi?.startsWith("\n") ||
          nextQuasi?.startsWith(";"))
      ) {
        cssString += `custom-js__${Buffer.from(nextExpression).toString(
          "base64"
        )}__:ignore${
          nextQuasi?.startsWith(";") || nextQuasi?.startsWith("{") ? "" : ";"
        }`;
      } else {
        cssString += `custom-prop__${Buffer.from(nextExpression).toString(
          "base64"
        )}__`;
      }
    }
  }

  return cssString;
}
