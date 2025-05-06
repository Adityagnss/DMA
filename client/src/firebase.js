import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaS###################M",
  authDomain: "dam-cb1a7.firebaseapp.com",
  projectId: "dam-cb1a7",
  storageBucket: "dam-cb1a7.appspot.com",
  messagingSenderId: "740175455236",
  appId: "1:740175455236:web:1d872596c3039ba63cc151"
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

// Request notification permission and get token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Get this from Firebase Console
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Handle incoming messages when app is in foreground
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
