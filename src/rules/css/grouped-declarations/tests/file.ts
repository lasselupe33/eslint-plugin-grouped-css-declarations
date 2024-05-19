// @ts-expect-error test-file
import { css } from "@linaria/core";

const test = css`
  z-index: 200;

  border-color: red;
  background: blue;

  color: green;
`;
