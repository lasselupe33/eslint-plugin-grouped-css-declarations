export function restoreExpressions(rawCss: string) {
  return rawCss
    .replace(/custom-prop__\d+_(.*?)__\n*/gm, (replaceable) => {
      const newlinesToRemove = Number(
        replaceable.match(/^custom-prop__(\d+)_/)?.[1] ?? 0,
      );
      const totalNewLines = Number(replaceable.match(/\n*$/m)?.[0].length ?? 0);

      const base64js = replaceable
        .replace(/^custom-prop__\d+_/m, "")
        .replace(/\n*$/, "")
        .replace(/__$/, "");

      return `$\{${Buffer.from(base64js, "base64").toString(
        "utf-8",
      )}}${"\n".repeat(totalNewLines - newlinesToRemove)}`;
    })
    .replace(/custom-js__\d+_(.*?)__:\s*?ignore\n*;?/gm, (replaceable) => {
      const newlinesToRemove = Number(
        replaceable.match(/^custom-js__(\d+)_/)?.[1] ?? 0,
      );
      const totalNewLines = Number(
        replaceable.match(/(\n*);?$/m)?.[1]?.length ?? 0,
      );

      const base64js = replaceable
        .replace(/^custom-js__\d+_/m, "")
        .replace(/\n*$/, "")
        .replace(/__:\s*?ignore/, "")
        .replace(/;$/, "");

      const includeSemiColon = replaceable.trimEnd().endsWith(";");

      return `$\{${Buffer.from(base64js, "base64").toString("utf-8")}}${
        includeSemiColon ? ";" : ""
      }${"\n".repeat(totalNewLines - newlinesToRemove)}`;
    });
}
