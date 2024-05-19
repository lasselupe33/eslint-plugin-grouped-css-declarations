/**
 * @type {import("stylelint").Config}
 */
module.exports = {
  // configure linaria to be used when linting inside css files
  fix: false,

  plugins: [
    require.resolve(
      "eslint-plugin-grouped-css-declarations/stylelint"
    ),
  ],

  rules: {
    "grouped-css-declarations/css": true,
  },
};
