/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude server-side modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
      
      // Mark server-only packages as external for client builds  
      config.externals = config.externals || [];
      config.externals.push({
        'node-cron': 'node-cron',
      });
    }

    return config;
  },
  // Ensure server components can use server-side modules
  experimental: {
    serverComponentsExternalPackages: ['node-cron'],
  },
};

export default nextConfig;
