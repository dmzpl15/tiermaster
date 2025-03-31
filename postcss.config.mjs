// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ Tailwind v4 기준으로 올바름
    autoprefixer: {},
  },
};
