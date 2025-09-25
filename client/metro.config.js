const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable web platform to prevent unnecessary web bundling
config.resolver.platforms = ['ios', 'android', 'native'];

// Optimize for development
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
