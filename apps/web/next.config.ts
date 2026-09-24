import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um standalone self-contained (server.js) usado pelo estágio `runner`
  // do Dockerfile, reduzindo bastante o tamanho da imagem de produção.
  output: "standalone",
};

export default nextConfig;

