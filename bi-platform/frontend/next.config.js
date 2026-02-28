/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  async rewrites() {
    // In development, proxy API calls to the FastAPI backend
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }
    return [];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "marketango.co",
      },
    ],
  },
};

module.exports = nextConfig;
