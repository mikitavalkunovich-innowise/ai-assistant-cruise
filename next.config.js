/** @type {import('next').NextConfig} */
const pdfTraceIncludes = [
  "./node_modules/pdfjs-dist/**/*",
  "./node_modules/pdf-to-img/**/*",
  "./node_modules/pdf-parse/**/*",
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-musl/**/*",
  "./node_modules/@napi-rs/canvas-linux-arm64-gnu/**/*",
];

const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist", "pdf-parse", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/api/legal-scout/preview": pdfTraceIncludes,
    "/api/legal-scout/analyze": pdfTraceIncludes,
    "/api/pdf-extractor": pdfTraceIncludes,
  },
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
