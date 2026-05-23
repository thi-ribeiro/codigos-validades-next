import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'export',  /* config options here */
  trailingSlash: false, // Isso fará com que /pages/login.js gere out/login.html
  allowedDevOrigins: ['192.168.1.24'],
  compress: true,
};

export default nextConfig;
