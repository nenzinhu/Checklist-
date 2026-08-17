/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantém comportamento de mount único, fiel ao SPA original (sem duplo efeito em dev).
  reactStrictMode: false,
};

export default nextConfig;
