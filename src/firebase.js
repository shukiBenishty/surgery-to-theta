import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/database';

var config = {
   apiKey: "AIzaSyDNESjdclnpCa9x8-s34gCUkUBYjTFlWbA",
   authDomain: "thetapreprod.firebaseapp.com",
   databaseURL: "https://thetapreprod.firebaseio.com",
   projectId: "thetapreprod",
   storageBucket: "thetapreprod.appspot.com",
   messagingSenderId: "774099448573"
 };
 
const firebaseApp = firebase.initializeApp(config);

const firestore = firebase.firestore();
const settings = {
  timestampsInSnapshots: true
};
firestore.settings(settings);

firestore.enablePersistence()
.then( () => {
  console.log('Offline is enabled');
})
.catch( err => {
  console.error(err);
})

export default firebaseApp;
