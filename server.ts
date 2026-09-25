import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const port = 3000;

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  // API Route: Upload Product Image
  app.post('/api/upload-product-image', express.json({ limit: '50mb' }), (req, res) => {
    try {
      const { filename, base64Data } = req.body;

      if (!filename || !base64Data) {
        return res.status(400).json({ error: 'Missing filename or base64Data' });
      }

      const targetDir = path.resolve(process.cwd(), 'public/productsimg');
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

      return res.status(200).json({
        success: true,
        filename: finalFilename,
        url: `/productsimg/${finalFilename}`,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });

  // API Route: List Product Images
  app.get('/api/list-product-images', (req, res) => {
    try {
      const targetDir = path.resolve(process.cwd(), 'public/productsimg');
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

      return res.status(200).json({
        success: true,
        images: files.map(f => ({
          filename: f,
          url: `/productsimg/${f}`,
        })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed listing images' });
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer().catch(console.error);
