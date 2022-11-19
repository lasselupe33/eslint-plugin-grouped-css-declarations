import { Node } from "@typescript-eslint/types/dist/generated/ast-spec";
import { TSESTree } from "@typescript-eslint/utils";
import { Declaration } from "postcss";

/**
 * Consolidates postcss node position into an eslint compatible position,
 * taking the entire source file into account
 */
export function getDeclarationPosition(
  node: Node,
  declaration: Declaration | undefined,
  optionalEndDeclaration?: Declaration | undefined
): Readonly<TSESTree.SourceLocation> | undefined {
  const startDeclaration = declaration;
  const endDeclaration = optionalEndDeclaration ?? declaration;

  if (!startDeclaration?.source?.start || !endDeclaration?.source?.end) {
    return;
  }

  const loc = {
    start: {
      column: startDeclaration.source.start.column - 1,
      line: node.loc.start.line - 1 + startDeclaration.source.start.line,
    },
    end: {
      column: endDeclaration.source.end.column - 1,
      line: node.loc.start.line - 1 + endDeclaration.source.end.line,
    },
  };

  return loc;
}
