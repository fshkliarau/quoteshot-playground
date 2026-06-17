// Dynamic config so the web base URL can come from the environment.
//   npm run build         → baseUrl ""  (serves from "/", e.g. Vercel / user-site)
//   npm run build:pages   → baseUrl "/<repo>" (GitHub Pages project site)
// Everything else is inherited from app.json.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments || {}),
    baseUrl: process.env.EXPO_BASE_URL || '',
  },
});
