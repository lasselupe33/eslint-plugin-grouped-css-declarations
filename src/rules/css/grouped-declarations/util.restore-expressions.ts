export function restoreExpressions(rawCss: string) {
  return rawCss
    .replace(/custom-prop__(.*?)__/g, (replaceable) => {
      const base64js = replaceable
        .replace(/^custom-prop__/, "")
        .replace(/__$/, "");

      return `$\{${Buffer.from(base64js, "base64").toString("utf-8")}}`;
    })
    .replace(/custom-js__(.*?)__:\s*?ignore;?/g, (replaceable) => {
      const base64js = replaceable
        .replace(/^custom-js__/, "")
        .replace(/__:\s*?ignore;?$/, "");

      const includeSemiColon = replaceable.endsWith(";");

      return `$\{${Buffer.from(base64js, "base64").toString("utf-8")}}${
        includeSemiColon ? ";" : ""
      }`;
    });
}
