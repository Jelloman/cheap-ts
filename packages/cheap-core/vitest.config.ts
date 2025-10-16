import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.{test,spec}.ts', '**/index.ts'],
    },
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
  },
  esbuild: {
    sourcemap: false,
  },
  server: {
    sourcemapIgnoreList: () => true,
  },
});
