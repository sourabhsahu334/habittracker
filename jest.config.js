module.exports = {
  testEnvironment: 'node',
  // The pure logic tests (stats/date) only need Babel to strip modern syntax —
  // no React Native runtime. Component/integration tests that render RN views
  // should add the @react-native/jest-preset package and use it here instead.
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      { presets: ['module:@react-native/babel-preset'] },
    ],
  },
};
