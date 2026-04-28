const path = require('path');

module.exports = {
  preset: 'react-native',
  setupFiles: [],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      { configFile: './babel.config.js' },
    ],
  },
  moduleDirectories: [
    'node_modules',
    path.resolve(__dirname, 'node_modules'),
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};