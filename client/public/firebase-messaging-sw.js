importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAj5mh04fawGL2v8HEQ1sygQ2oYWTofEhM",
  authDomain: "dam-cb1a7.firebaseapp.com",
  projectId: "dam-cb1a7",
  storageBucket: "dam-cb1a7.appspot.com",
  messagingSenderId: "740175455236",
  appId: "1:740175455236:web:1d872596c3039ba63cc151"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'notification',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
