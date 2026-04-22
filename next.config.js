/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // sql.js WASM is fetched at runtime from /public — don't let webpack touch it
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Prevent webpack from trying to process .wasm imports from sql.js
    config.module.rules.push({
      test: /sql-wasm\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
};

module.exports = nextConfig;
