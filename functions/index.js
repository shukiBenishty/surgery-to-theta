const functions = require('./init.js').functions;
const firestore = require('./init.js').firestore;
const realTimeDB = require('./init.js').realTimeDB;
const uuidv4 = require('uuid/v4');

const moment = require('moment');
const Validator = require('jsonschema').Validator;
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')({origin: true});

const app = express();
app.use(cors);

app.use(bodyParser.json({
  strict:false
}));


///for spread (...obj)
var _spread =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };




app.post('/pupil', (req, res) => {

  if( !req.is('application/json') ) {
    var header = JSON.stringify(req.headers['content-type']);
    console.log(`Incoming header: ${header}`);
    console.log(`Content-Type header ${header} is not supported`);
    return res.status(406) //Not Acceptable
           .send(`Content-Type header ${header} is not supported`);
  }

  res.set({
    'Content-Type': 'application/json'
  });

  var groupSymbol = req.body.groupSymbol;
  var secret = req.query.secret;

  if( secret === 'undefined' ) {
    console.log( `Not authorized. Provide 'secret' parameter in url`);
    return res.status(401)
           .json({
             errorCode: 401,
             errorMessage: `Not authorized. Provide 'secret' parameter in url`
           })
  }
  if( secret !== 'Day1!' && secret !== 'Ep$ilon' ) {
    console.log( `Not authorized. 'secret' parameter is not valid`);
    return res.status(401)
           .json({
             errorCode: 401,
             errorMessage: `Not authorized. 'secret' parameter is not valid`
           })
  }

  if( !groupSymbol ) {
    console.log( `Can't find expected parameter - groupSymbol - in request body`);
    return res.status(200)
    .json({
      errorCode: 3,
      errorMessage: `Can't find expected parameter - groupSymbol - in request body`
    })
  }

  const schema = {
    "groupSymbol": "string",
    "name": "string",
    "family": "string",
    "pupilId": "string",
    "parentId": "string",
    "phoneNumber": "number",
    "paymentApprovalNumber": "string",
    "medicalLimitations": "boolean",
    "whenRegistered": "date"
  };
  const v = new Validator();
  console.log(`Validation: ${v.validate(req.body, schema).valid}`);

  // format date to unix epoch milliseconds in order to comply
  // with Firebase 'timestamp' type
  const birthDay = moment(req.body.DateOfBirth, "YYYY-MM-DD HH:mm:ss").format('DD/MM/YYYY');
  //console.log('Birthday: ' + birthDay);
  const when = moment(req.body.whenRegistered, "YYYY-MM-DD HH:mm:ss").format('DD/MM/YYYY HH:mm:ss');
  //console.log('When: ' + when);
  let pupil = {
    name: req.body.name,
    lastName: req.body.family,
    pupilId: ( req.body.pupilId ) ? req.body.pupilId : '',
    address: ( req.body.address ) ? req.body.address : '',
    birthDay: birthDay,
    parentId: (req.body.parentId) ? req.body.parentId : '',
    paymentApprovalNumber: (req.body.PaymentConfirmationNumber) ?
        req.body.PaymentConfirmationNumber : '',
    payerName: ( req.body.name_pay ) ? req.body.name_pay : '',
    status: ( req.body.status ) ? req.body.status : '',
    registrationSource: ( req.body.registration_source ) ? req.body.registration_source : '',
    phoneNumber: req.body.phoneNumber,
    medicalLimitations: req.body.medicalLimitations,
    whenRegistered: when // valueOf() is actually unix() * 1000
  }

  console.log(`Received pupil: {
                name: ${pupil.name},
                lastName: ${pupil.lastName},
                pupilId: ${pupil.pupilId},
                address: ${pupil.address},
                birthDay: ${pupil.birthDay},
                parentId: ${pupil.parentId},
                paymentApprovalNumber: ${pupil.paymentApprovalNumber},
                payerName: ${pupil.payerName},
                status: ${pupil.status},
                registrationSource: ${pupil.registrationSource},
                phoneNumber:${pupil.phoneNumber},
                medicalLimitations: ${pupil.medicalLimitations},
                whenRegistered:${pupil.whenRegistered}
              }`);

  let updates = {};
  let pupilId = uuidv4();
  return realTimeDB.ref('groups').orderByChild(`/symbol`)
        .equalTo(groupSymbol.toString()).once('value')
        .then((snapshot) => {
            if (snapshot.val()) {
                let _groups = snapshot.val();
                for(key in _groups){
                  let _group = _groups[key];
                  console.log(_group);

                  pupil.metadata = {};
                  pupil.metadata.authority = _group.metadata.authority;
                  pupil.metadata.unitId = _group.metadata.unitId;
                  pupil.metadata.groupId = key;
                  pupil.metadata.pupilId = pupilId;
                  updates[`pupils/${pupilId}`] = pupil;
                  updates[`groups/${key}/metadata/pupils/${pupilId}`] = pupilId;
                  updates[`groups/${key}/registeredPupils`] = _group.registeredPupils + 1;
                  console.log(pupil);
                }
                return realTimeDB.ref().update(updates).then(() => {
                  return res.status(200).json({
                    id: pupilId
                  })
                });
            } else{
              return res.status(200)
                    .json({
                        errorCode: 2,
                        errorMessage: `No group identified by symbol '${req.body.groupSymbol}' was found`
                      });
          }
        })
        .catch((err) =>{
            console.error(err);
            return res.status(200)
                  .json({
                      errorCode: 2,
                      errorMessage: err.message
                    });

        })
    });



app.get('/registeredPupilsInGroups', (req, res) => {
  let updates = {};
  let promises = [];
  let totalPupils = 0;
  return realTimeDB.ref('groups').once('value').then((groupsSnapshot) => {
    let _groups = groupsSnapshot.val();
    for(key in _groups){
      let _groupId = key;
      promises.push(realTimeDB.ref('pupils')
       .orderByChild(`/metadata/groupId`)
       .equalTo(_groupId)
       .once('value')
       .then((pupilsSnapshot) => {
             console.log(_groupId);
             let pupilInGroup = 0;
             let _pupils = pupilsSnapshot.val();
             for(_pupilId in _pupils){
               pupilInGroup++;
               totalPupils++;
             }
             updates[`groups/${_groupId}/registeredPupils`] = pupilInGroup;
             console.log(`registeredPupils in group ${_groupId}: ${pupilInGroup}`);
             return true;
       })
      );
    }
    return Promise.all(promises)
            .then(() => {
              return realTimeDB.ref().update(updates).then(() => {
                console.log(`found ${totalPupils} pupils`);
                return res.status(200).json({
                  totalPupils: totalPupils
                })
              });
            })

  })
  .catch((err) =>{
      console.error(err);
      return res.status(200)
            .json({
                errorCode: 2,
                errorMessage: err.message
              });

  })
})

app.get('/pupilsPropertiesTypes', (req, res) => {
  let updates = {};
  let promises = [];
  return realTimeDB.ref('pupils').once('value').then((snapshot) => {
    if (snapshot.val()) {
        let _pupils = snapshot.val();
        for(key in _pupils){
          let changed = false;
          let _pupilId = key;
          const _pupil = _pupils[_pupilId];

          if (_pupil.hasOwnProperty('pupilId')) {
            _pupil.parentId = _pupil.pupilId.toString();
          }
          if (_pupil.hasOwnProperty('parentId')) {
            _pupil.parentId = _pupil.parentId.toString();
          }
          if (_pupil.hasOwnProperty('medicalLimitations')) {
            if (_pupil.medicalLimitations === "false" ||
                 _pupil.medicalLimitations === "0" ||
                 _pupil.medicalLimitations === 0 ) {
                _pupil.medicalLimitations = false;
            }else if (_pupil.medicalLimitations === "true" ||
                     _pupil.medicalLimitations === "1" ||
                     _pupil.medicalLimitations === 1 ) {
                _pupil.medicalLimitations = true;
            }
          }
          updates[`pupils/${_pupilId}`] = _pupil;
        }
        return realTimeDB.ref().update(updates).then(() => {
          return res.status(200).json({
            status: "ok"
          })
        });
    } else {
        return res.status(200).json({
          status: "error",
          errorMessage: `not pupils was found`
        });
    }
  })
  .catch((err) =>{
    console.error(err);
    return res.status(200)
      .json({
          errorCode: 2,
          errorMessage: err.message
    });
  })
})

exports.api = functions.https.onRequest(app);

const updataPemitions = (unitId, updates) => {
  let promise = [];
  return realTimeDB.ref(`units/${unitId}/metadata/permissions`).once('value').then((snapshot) => {
    const permissions = snapshot.val();
    promise.push(realTimeDB.ref(`groups`)
      .orderByChild(`/metadata/unitId`).equalTo(unitId).once('value').then((groupsSnapshot) => {
        const groups = groupsSnapshot.val();
        for (let groupId in groups) {
          if (groups.hasOwnProperty(groupId)) {
            updates[`groups/${groupId}/metadata/permissions`] = permissions;
          }
        }
        return true;
      }));
    promise.push(realTimeDB.ref(`pupils`)
        .orderByChild(`/metadata/unitId`).equalTo(unitId).once('value').then((pupilsSnapshot) => {
          const pupils = pupilsSnapshot.val();
          for (let pupilId in pupils) {
            if (pupils.hasOwnProperty(pupilId)) {
              updates[`pupils/${pupilId}/metadata/permissions`] = permissions;
            }
          }
          return true;
        }))
    return Promise.all(promise).then(() => {
      return true;
    });
  })
}

exports.userPermissionsChanged = functions.database.ref('users/{userId}/permissions/')
    .onWrite((change, context) => {
      let updates = {};
      let permissions = {};
      let promises = [];

      // when the data is deleted.
      if (!change.after.exists()) {
        let original = change.before.val();
        for (let _unitId in original) {
          if (original.hasOwnProperty(_unitId)) {
            permissions[_unitId] = null;
          }
        }
      }
      // when the data is new.
      if (!change.before.exists()) {
       let document = change.after.val();
       for (let _unitId in document) {
         if (document.hasOwnProperty(_unitId)) {
           permissions[_unitId] = document[_unitId];
         }
       }
      }
      // when the data is edit.
      if (change.before.exists() && change.after.exists()) {
       let original = change.before.val();
       for (let _unitId in original) {
         if (original.hasOwnProperty(_unitId)) {
           permissions[_unitId] = null;
         }
       }

       let document = change.after.val();
       for (let _unitId in document) {
         if (document.hasOwnProperty(_unitId)) {
           permissions[_unitId] = document[_unitId];
         }
       }
      }


      return realTimeDB.ref(`users/${context.params.userId}`)
      .once('value').then(( snapshot ) => {
        const permissionsId = snapshot.val().permissionsId;
        for (let _unitId in permissions) {
          if (permissions.hasOwnProperty(_unitId)) {
            updates[`units/${_unitId}/metadata/permissions/${permissionsId}`] = permissions[_unitId];
          }
        }
        return realTimeDB.ref().update(updates).then(() => {
          let subUpdates = {};
          for (let key in permissions) {
            let _unitId = key
            if (permissions.hasOwnProperty(_unitId)) {
              promises.push(updataPemitions(_unitId, subUpdates));
            }
          }
          return Promise.all(promises).then(() => {
            console.log(subUpdates);
            return realTimeDB.ref().update(subUpdates);
          });
        })
      })
  });
