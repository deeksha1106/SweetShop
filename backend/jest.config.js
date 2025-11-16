module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!server.js',
    '!app.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './controllers/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './models/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './middleware/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Transform configuration for ES modules if needed
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'node'],
  
  // Test results processor
  // testResultsProcessor: 'jest-sonar-reporter', // Disabled - package not installed
  
  // Reporters
  reporters: [
    'default'
    // ['jest-junit', {
    //   outputDirectory: 'test-results',
    //   outputName: 'junit.xml'
    // }],
    // ['jest-html-reporters', {
    //   publicPath: './test-results',
    //   filename: 'report.html',
    //   expand: true
    // }]
  ],
  
  // Global variables available in tests
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};
