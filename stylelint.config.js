module.exports = {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['**/*.js', '**/*.ts'],
  rules: {
    'no-duplicate-selectors': null,
    'no-missing-end-of-source-newline': null,
    'no-descending-specificity': null,
    'selector-type-no-unknown': null,
    'at-rule-empty-line-before': null,
    'rule-empty-line-before': null,
    'string-quotes': null,
    'at-rule-no-unknown': null,
    'import-notation': 'string',
    'property-no-vendor-prefix': true,
    'max-nesting-depth': 4,
    'selector-class-pattern':
      '^([_a-zA-Z][a-zA-Z0-9]*)((__|_|-)[a-zA-Z0-9]+)*$',
    'selector-id-pattern': '^([_a-zA-Z][a-zA-Z0-9]*)((__|_|-)[a-zA-Z0-9]+)*$',
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['contain', 'appearance', '/^font-/'],
      },
    ],
  },
}
