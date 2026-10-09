const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // When BACKEND_URL is set the FastAPI service replaces the bundled fixture routes.
  async rewrites() {
    if (!backendUrl) return []
    return {
      beforeFiles: [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }],
    }
  },
}

export default nextConfig
