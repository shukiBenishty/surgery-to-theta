import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

var config = {
   apiKey: "AIzaSyAT9qGs8q0Mij_uG1TZS9Ml03BT1cesPqQ",
   authDomain: "thetadev-49eb5.firebaseapp.com",
   databaseURL: "https://thetadev-49eb5.firebaseio.com",
   projectId: "thetadev-49eb5",
   storageBucket: "thetadev-49eb5.appspot.com",
   messagingSenderId: "652844477709"
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
