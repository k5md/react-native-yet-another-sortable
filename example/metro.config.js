const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname, '..')],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },

  resolver: {
    /*
      NOTE: if parent project has any regular dependencies that have to be included,
      this RegExp will block them, use only if parent project has only peer and dev dependencies
    */
    blockList: new RegExp(
      `^${path.resolve(__dirname, '..', 'node_modules').replace(/[/\\\\]/g, '[/\\\\]')}.*`
    ),
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => {
          if (target.hasOwnProperty(name)) {
            return target[name];
          }
          return path.resolve(__dirname, 'node_modules', String(name));
        },
      },
    ),
  },
};

module.exports = mergeConfig(defaultConfig, config);
