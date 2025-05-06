import { initializeApp } from "firebase/app";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase with client config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// Send push notification using fetch
export const sendNotification = async (token, title, body) => {
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          icon: '/logo192.png',
          click_action: '/'
        }
      })
    });

    const data = await response.json();
    console.log('Successfully sent notification:', data);
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};
