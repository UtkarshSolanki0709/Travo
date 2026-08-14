const { withAppBuildGradle } = require('@expo/config-plugins');

const withDuplicateManifestFix = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const patch = `
android {
    packagingOptions {
        pickFirst 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'
        pickFirst 'META-INF/OSGI-INF/MANIFEST.MF'
        pickFirst 'META-INF/LICENSE*'
        pickFirst 'META-INF/NOTICE*'
        pickFirst 'META-INF/DEPENDENCIES*'
        pickFirst 'META-INF/INDEX.LIST'
    }
}
`;
      if (!config.modResults.contents.includes('META-INF/versions/9/OSGI-INF/MANIFEST.MF')) {
        config.modResults.contents += patch;
      }
    }
    return config;
  });
};

module.exports = ({ config }) => {
  const customConfig = {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
  };
  return withDuplicateManifestFix(customConfig);
};
