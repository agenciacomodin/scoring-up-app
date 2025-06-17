// RUTA: next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Esta configuración es ESENCIAL para que 'pdf-parse' o 'pdfjs-dist' no fallen.
        // Le decimos a Webpack: "Si encuentras un intento de usar 'fs', 'child_process' etc.
        // en el código del cliente, no te preocupes, déjalo pasar como si estuviera vacío".
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                child_process: false,
                net: false,
                tls: false,
            };
        }

        return config;
    },
};

export default nextConfig;