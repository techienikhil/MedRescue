// ====================================================
// Firebase Initialization (v8 compat mode via CDN)
// ====================================================

const firebaseConfig = {
  apiKey: "AIzaSyCvG6nX-LC-r_5iY6qPdlIC9eXArnHiol0",
  authDomain: "medrescue-d80fe.firebaseapp.com",
  projectId: "medrescue-d80fe",
  storageBucket: "medrescue-d80fe.firebasestorage.app",
  messagingSenderId: "631779086351",
  appId: "1:631779086351:web:e4028d866931540664137a",
  measurementId: "G-1P977NV5DY"
};

// Wait for Firebase SDK to load, then init
(function() {
  function initFirebase() {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded yet, retrying...');
      setTimeout(initFirebase, 500);
      return;
    }
    if (firebase.apps.length) return; // already initialized

    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();

    // Enable offline persistence
    db.enablePersistence().catch(err => {
      if (err.code !== 'failed-precondition') {
        console.warn('Firestore persistence:', err.code);
      }
    });

    console.log('Firebase initialized successfully');
  }

  if (document.readyState === 'complete') {
    initFirebase();
  } else {
    window.addEventListener('load', initFirebase);
  }
})();
