const isProd = process.env.NODE_ENV === 'production';

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Minify CSS in production — removes whitespace, merges rules, deduplicates
    ...(isProd && {
      cssnano: {
        preset: ['default', {
          // Keep calc() expressions — needed for some Tailwind utilities
          calc: false,
          // Preserve z-index values (avoid reordering)
          zindex: false,
          // Don't mangle animation names
          normalizeWhitespace: true,
          // Merge duplicate selectors
          mergeRules: true,
          discardComments: { removeAll: true },
        }],
      },
    }),
  },
};
