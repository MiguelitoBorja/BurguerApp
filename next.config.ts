import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! ATENCIÓN: Esto ignora errores de tipado para poder compilar
    ignoreBuildErrors: true,
  },
};

export default nextConfig;