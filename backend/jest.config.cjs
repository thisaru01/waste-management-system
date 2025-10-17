/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: {
    '^.+\\.[jt]sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: { syntax: 'ecmascript', jsx: false },
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/middleware/**/*.js',
    'src/utils/**/*Validator.js',
    'src/utils/errors.js',
    '!src/utils/seed.js',
    '!src/utils/settingsValidator.js' // add tests later
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFiles: [],
};
