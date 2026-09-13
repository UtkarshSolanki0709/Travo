// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'supabase/**', '.expo/**'],
  },
  {
    rules: {
      // Reanimated shared values (scale.value = ...) mutate by design
      'react-hooks/immutability': 'off',
      // Allow async data fetching functions called in effects in React Native
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
