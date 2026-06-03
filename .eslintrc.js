module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended-legacy',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  overrides: [
    {
      files: ['playwright.config.js', 'tests/**/*.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['scripts/build-json.js'],
      env: { node: true },
      rules: {
        'no-underscore-dangle': 'off',
        'no-console': 'off',
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
