import { collection, getDocs } from 'firebase/firestore';
import { db } from './services/firebase';

async function testConnection() {
  try {
    console.log("Fetching parts from Firestore...");
    const querySnapshot = await getDocs(collection(db, 'parts'));
    console.log(`Successfully fetched ${querySnapshot.size} parts.`);
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
    });
  } catch (error) {
    console.error("Error fetching parts: ", error);
  }
}

testConnection();
