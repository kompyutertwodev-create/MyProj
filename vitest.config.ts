import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load apps/api/.env then override with apps/api/.env.test
  const apiDir = path.resolve(__dirname, 'apps/api');
  const apiEnv = loadEnv(mode, apiDir, '');
  const testEnv = loadEnv('test', apiDir, '');

  return {
    test: {
      globals: true,
      environment: 'node',
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      env: { ...apiEnv, ...testEnv },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          '**/*.d.ts',
          '**/*.config.{js,ts}',
          '**/coverage/**',
          '**/tests/**',
          '**/e2e/**',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
      include: ['**/*.test.ts', '**/*.test.tsx'],
      exclude: [
        'node_modules',
        'dist',
        '.next',
        '.idea',
        '.git',
        'coverage',
        '**/node_modules/**',
        'packages/ui/src/components/**',
      ],
    },
    resolve: {
      alias: {
        '@workspace/kernel': path.resolve(__dirname, './packages/kernel/src'),
        '@workspace/contracts': path.resolve(__dirname, './packages/contracts/src'),
        '@workspace/platform': path.resolve(__dirname, './packages/platform/src'),
        '@workspace/platform-client': path.resolve(__dirname, './packages/platform/client/src'),
        '@workspace/ui': path.resolve(__dirname, './packages/ui/src'),
      },
    },
  };
});