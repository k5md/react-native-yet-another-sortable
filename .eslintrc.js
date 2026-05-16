module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: '@react-native',
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['module:@react-native/babel-preset'],
    },
  },
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'no-bitwise': 'off',
  },
  ignorePatterns: [
    '**/node_modules/**',
    '**/android/**',
    '**/ios/**',
    '**/.bundle/**',
    '*.d.ts',
  ],
};