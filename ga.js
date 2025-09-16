  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyC48ymmyVV_iD7Tl-FIwnquQOix6pKNmqo",
    authDomain: "teak-instrument-472110-t9.firebaseapp.com",
    projectId: "teak-instrument-472110-t9",
    storageBucket: "teak-instrument-472110-t9.firebasestorage.app",
    messagingSenderId: "481734987573",
    appId: "1:481734987573:web:a6cb4af62eff8599f6067c",
    measurementId: "G-PEQH7CBMNS"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
