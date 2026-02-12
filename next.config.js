/** @type {import('next').NextConfig} */
const isGithubPagesBuild = process.env.GH_PAGES === "true";
const basePath = isGithubPagesBuild ? "/orario-sync_react" : "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined
};

module.exports = nextConfig;
