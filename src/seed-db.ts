import { seedFirestoreParts } from './services/inventoryStorage';

async function runSeed() {
  console.log("Seeding parts...");
  await seedFirestoreParts();
  console.log("Seeding complete.");
}

runSeed();
