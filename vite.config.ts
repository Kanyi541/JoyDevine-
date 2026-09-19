import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function productImagesStoragePlugin(): Plugin {
  return {
    name: 'product-images-storage-plugin',
    configureServer(server) {
      server.middlewares.use('/api/upload-product-image', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { filename, base64Data } = data;

            if (!filename || !base64Data) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Missing filename or base64Data' }));
            }

            const targetDir = path.resolve(__dirname, 'public/productsimg');
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }

            // Clean filename and ensure valid extension
            const sanitizedBase = filename
              .toLowerCase()
              .replace(/[^a-z0-9.-]/g, '_')
              .replace(/_+/g, '_');
            const ext = path.extname(sanitizedBase) || '.jpg';
            const basenameWithoutExt = path.basename(sanitizedBase, ext);
            const finalFilename = `${basenameWithoutExt}-${Date.now()}${ext}`;
            const targetPath = path.join(targetDir, finalFilename);

            // Strip data:image/...;base64, if present
            const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');
            fs.writeFileSync(targetPath, buffer);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: true,
                filename: finalFilename,
                url: `/productsimg/${finalFilename}`,
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message || 'Upload failed' }));
          }
        });
      });

      server.middlewares.use('/api/list-product-images', (req, res) => {
        try {
          const targetDir = path.resolve(__dirname, 'public/productsimg');
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          const files = fs
            .readdirSync(targetDir)
            .filter(f => /\.(jpg|jpeg|png|webp|svg|gif|avif)$/i.test(f))
            .sort((a, b) => {
              const statA = fs.statSync(path.join(targetDir, a));
              const statB = fs.statSync(path.join(targetDir, b));
              return statB.mtimeMs - statA.mtimeMs;
            });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              success: true,
              images: files.map(f => ({
                filename: f,
                url: `/productsimg/${f}`,
              })),
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: err.message || 'Failed listing images' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), productImagesStoragePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
