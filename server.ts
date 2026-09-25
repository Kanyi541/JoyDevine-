import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = express();
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  app.get('/i/:slug', async (req, res) => {
    const slug = req.params.slug;
    try {
        const docRef = doc(db, 'urlRedirects', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          res.redirect(docSnap.data().longUrl);
        } else {
          res.status(404).send('Not found');
        }
    } catch (error) {
        console.error('Error redirecting:', error);
        res.status(500).send('Server error');
    }
  });

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}
startServer();
