import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to THIS folder so Next ignores stray lockfiles elsewhere.
  turbopack: {
    root: path.resolve(),
  },
  outputFileTracingRoot: path.resolve(),
};

export default nextConfig;
