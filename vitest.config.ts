import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 20000,
    hookTimeout: 20000,
    exclude: ['node_modules', 'dist', 'sdk'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage-vitest',
      reporter: ['lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/sdk/**'
      ],
      thresholds: {
        lines: 40,
        functions: 50,
        branches: 40,
        statements: 40
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@service': path.resolve(__dirname, './src/service'),
      '@stores': path.resolve(__dirname, './src/stores')
    }
  },
  optimizeDeps: {
    exclude: ['sdk']
  }
});

