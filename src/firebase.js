import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyDQLNnI6sdBKRPa4tSdPblERl8OR96vAoI",
  authDomain: "susubmk-cc97c.firebaseapp.com",
  projectId: "susubmk-cc97c",
  storageBucket: "susubmk-cc97c.firebasestorage.app",
  messagingSenderId: "811474321348",
  appId: "1:811474321348:web:c51e83d5e3ee18bf2aae91"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);