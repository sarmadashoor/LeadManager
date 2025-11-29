/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // If you have path aliases in tsconfig, you can map them here later
  // moduleNameMapper: {
  //   '^@src/(.*)$': '<rootDir>/src/$1',
  // },
};
