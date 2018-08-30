const functions = require('firebase-functions');
require('firebase/firestore');
require('firebase/auth');

const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();

const realTimeDB = admin.database();

exports.firestore = firestore;
exports.functions = functions;
exports.realTimeDB = realTimeDB;
