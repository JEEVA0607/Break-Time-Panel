import {
  initializeApp
} from "firebase/app";

import {
  getFirestore,
  collection,
  getDocs
} from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAxuHj3E6QpDSIU1qrKNOb_itsUDU74ShQ",
  authDomain: "break-time-system.firebaseapp.com",
  projectId: "break-time-system",
  storageBucket: "break-time-system.firebasestorage.app",
  messagingSenderId: "1048947652967",
  appId: "1:1048947652967:web:a3305032a5d1b5b975d7c2"
};


const app =
  initializeApp(firebaseConfig);


const db =
  getFirestore(app);


export {
  db,
  collection,
  getDocs
};
