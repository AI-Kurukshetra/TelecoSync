const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../.."),
    typedRoutes: true,
  },
};

module.exports = nextConfig;
