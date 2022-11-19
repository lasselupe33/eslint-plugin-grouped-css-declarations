<h1 align="center">ESLint Plugin Grouped CSS Declarations</h1>

Identifies @linaria/core CSS-in-JS tags and ensures that a standardised grouping of declarations is enforced using the PostCSS parser.

A `group` is identified as a logical set of declarations separated by either an empty line or a comment.

Issues will, whereever possible, be reported inline at violating CSS lines to allow developers to easily digest issues. However, in some cases such reports have not been implemented.

In practice the reports exist simply to improve DX-experience. The actual auto-fix relies upon comparing the original AST with an AST that fully respects the configured ordering, prioritised as follows:

1) Declaration grouping will be considered in scopes. AtRule and Rule creates new scopes.
2) The root scope will be positioned before other scopes. Then Rule scopes will follow and finally AtRules.
3) Inside each scope declarations will be sorted based on the provided grouping.
4) In case a group of declarations begins with a comment, then these will be taken out of the ordering flow and positioned at the end of the scope. *Ordering will not be performed for this group.*
5) If a declaration does not match any provided grouping then it will be added to a final group after all other groups. Inside declarations will be sorted alphabetically.

## Installation

- Requires ESLint `>=8`

```
yarn add --dev eslint-plugin-grouped-css-declarations
npm install --save-dev eslint-plugin-grouped-css-declarations
```

## Usage

To include the recommended `eslint-plugin-grouped-css-declarations` to your ruleset add the following to your `.eslintrc` configuration:

```json
{
  "extends": [
    "plugin:grouped-css-declarations/recommended"
  ]
}
```
