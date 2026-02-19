/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // If you are using standard API routes (Pages router style in App dir), 
  // the limit is handled differently, but for App Router server actions this helps.
  // For standard API Routes (app/api/...), we might need per-route config.
};

export default nextConfig;