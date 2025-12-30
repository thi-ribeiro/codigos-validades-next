import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'export',  /* config options here */
  trailingSlash: false, // Isso fará com que /pages/login.js gere out/login.html
};

export default nextConfig;
