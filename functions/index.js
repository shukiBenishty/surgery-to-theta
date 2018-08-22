const functions = require('firebase-functions');
require('firebase/firestore');

const admin = require('firebase-admin');
const moment = require('moment');
var Validator = require('jsonschema').Validator;

admin.initializeApp();
const firestore = admin.firestore();

const realTimeDB = admin.database();


const express = require('express');

var bodyParser = require('body-parser');
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

app.get('/groups', (req, res) => {
  return getGroups(req, res)
  .then( groups => {
    return res.send(groups);
  });
});

app.get('/group', (req, res) => {

  const groupSymbol = req.query.symbol;

  return getGroups(req, res)
  .then( groups => {

    const group = groups.find( group => {
      return group.symbol === groupSymbol
    });

    return res.send(group);
  })

});

app.get('/units', (req, res) => {
  return getUnits(req, res);
})

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
  const birthDay = moment(req.body.DateOfBirth, "YYYY-MM-DD HH:mm:ss");
  //console.log('Birthday: ' + birthDay);
  const when = moment(req.body.whenRegistered, "YYYY-MM-DD HH:mm:ss");
  //console.log('When: ' + when);
  const pupil = {
    name: req.body.name,
    lastName: req.body.family,
    pupilId: ( req.body.pupilId ) ? req.body.pupilId : '',
    address: ( req.body.address ) ? req.body.address : '',
    birthDay: new Date(birthDay.valueOf()),
    parentId: (req.body.parentId) ? req.body.parentId : '',
    paymentApprovalNumber: (req.body.PaymentConfirmationNumber) ?
        req.body.PaymentConfirmationNumber : '',
    payerName: ( req.body.name_pay ) ? req.body.name_pay : '',
    status: ( req.body.status ) ? req.body.status : '',
    registrationSource: ( req.body.registration_source ) ? req.body.registration_source : '',
    phoneNumber: req.body.phoneNumber,
    medicalLimitations: req.body.medicalLimitations,
    whenRegistered: new Date(when.valueOf()) // valueOf() is actually unix() * 1000
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
  return getGroups(req, res)
  .then( groups => {

    const _group = groups.find( group => {
      return group.symbol === groupSymbol
    });

    if( !_group ) {

      // This will bw catched at the end of promises chain
      throw new Error(`No group identified by symbol '${req.body.groupSymbol}' was found`);

    } else {

      //console.log(`Found group: id: ${_group.id} unitId: ${_group.unitId}`);

      return {
        groupdId: _group.id,
        unitId: _group.unitId
      }
    }
  })
  .then( groupParams => {

    console.log(`Processing group: ${groupParams.groupdId}, in  unit: ${groupParams.unitId}`);

    return firestore.collection('units/' + groupParams.unitId + '/groups/' + groupParams.groupdId + '/pupils/')

  })
  .then( pupilsCollectionRef => {

    return pupilsCollectionRef.add(pupil);

  })
  .then( ref => {
    console.log(`Create pupil with id: ${ref.id}`);
    return res.status(200).json({
      id: ref.id
    });

  })
  .catch( err => {
    console.error(`Error catched ${err.message}`);
    return res.status(200)
          .json({
              errorCode: 2,
              errorMessage: err.message
            });

  });

});

exports.api = functions.https.onRequest(app);

exports.groups = functions.https.onRequest((req, res) => {

  var method = req.method;
  if( method === 'GET') {

    return getGroups(req, res)
    .then( groups => {
      return res.send(groups);
    });

  } else {

    return res.status(404).send(`Cannot ${method}`)
  }

});

exports.units = functions.https.onRequest((req, res) => {
  var method = req.method;
  if( method === 'GET') {

    return getUnits(req, res);

  } else {

    return res.status(404).send(`Cannot ${method}`)

  }

});


exports.unregisterPupil  = functions.firestore
    .document('units/{unitId}/groups/{groupId}/pupils/{pupilId}')
    .onDelete((snap, context) => {
      console.log(`onDelete PupilId: ${context.params.pupilId}`);

      let promises = [];
      var updates = {};
      const doc = firestore.doc(`units/${context.params.unitId}/groups/${context.params.groupId}`);

      promises.push(doc.get()
                .then( _doc => {
                  const docData = _doc.data();

                  const value = docData.registeredPupils - 1;
                  return doc.update({
                    registeredPupils: value
                  })
                  .then( res => {
                    console.log(`RegisteredPupils=${value}`);
                    return true;
                  })
                }).catch( err => {
                    console.error(`Error catched ${err.message}`);
                }));
      updates[`/groups/${context.params.groupId}/pupils/${context.params.pupilId}`] = null;
      updates[`/pupils/${context.params.pupilId}`] = null;

      promises.push(realTimeDB.ref().update(updates));

      return Promise.all(promises);
    })

  exports.registerPupil = functions.firestore
  .document('units/{unitId}/groups/{groupId}/pupils/{pupilId}')
  .onCreate( (document, context) => {
    console.log(`onCreate  ${context.params.pupilId}`);

    let promises = [];
    var updates = {};
    const doc = firestore.doc(`units/${context.params.unitId}/groups/${context.params.groupId}`);

    promises.push(doc.get()
              .then( _doc => {
                  const docData = _doc.data();

                  const value = docData.registeredPupils + 1;

                  return doc.update({
                    registeredPupils: value
                  })
                  .then( res => {
                    console.log(`RegisteredPupils=${docData.registeredPupils}`);
                    return true;
                  })
              })
              .then( res => {
                const _json = JSON.stringify(res);
                console.log(`Update result: ${_json}`);
                return true;
              }).catch( err => {
                  console.error(`Error catched ${err.message}`);
              }));

    promises.push(realTimeDB.ref(`units/${context.params.unitId}`).once('value').then((snapshot) =>  {
      var _unit = snapshot.val();
      return {
       unitName: (_unit && _unit.name_he) || null,
       authority: (_unit && _unit.authority) || null
      }
    }));

    // promises.push(realTimeDB.ref(`groups/${context.params.groupId}`).once('value').then((snapshot) =>  {
    //   var _group = snapshot.val();
    //   return {
    //     groupSymbol: (_group && _group.symbol) || null,
    //     groupName: (_group && _group.name) || null
    //   }
    // }));

    return Promise.all(promises).then((val) => {
      updates[`/groups/${context.params.groupId}/pupils/${context.params.pupilId}`] = {
        "pupilId": context.params.pupilId,
        };
      updates[`/pupils/${context.params.pupilId}`] = _spread({}, document, {
                                                      "id": context.params.pupilId,
                                                      "groupId": context.params.groupId,
                                                      "authority": val[0].authority,
                                                      "unitId": context.params.unitId,
                                                      "birthDay": document.birthDay && document.birthDay.seconds ? moment.unix(document.birthDay.seconds).format('DD/MM/YYYY') : '',
                                                      "whenRegistered": document.whenRegistered && document.whenRegistered.seconds ? moment.unix(document.whenRegistered.seconds).format('DD/MM/YYYY HH:mm:ss') : ''
                                                      });
      return realTimeDB.ref().update(updates)
    });
  })

exports.updatePupil = functions.firestore
    .document('units/{unitId}/groups/{groupId}/pupils/{pupilId}')
    .onUpdate((change, context) => {
      console.log(`onUpdate  ${context.params.pupilId}`);

      var updates = {};
      var promises = [];
      const document = change.after.data();

     promises.push(realTimeDB.ref(`units/${context.params.unitId}`).once('value').then((snapshot) =>  {
        var _unit = snapshot.val();
        return {
         unitName: (_unit && _unit.name_he) || null,
         authority: (_unit && _unit.authority) || null
        }
      }));

      // promises.push(realTimeDB.ref(`groups/${context.params.groupId}`).once('value').then((snapshot) =>  {
      //   var _group = snapshot.val();
      //   return {
      //     groupSymbol: (_group && _group.symbol) || null,
      //     groupName: (_group && _group.name) || null
      //   }
      // }));

      return Promise.all(promises).then((val) => {
        updates[`/pupils/${context.params.pupilId}`] = _spread({}, document, {
                                                        "id": context.params.pupilId,
                                                        "groupId": context.params.groupId,
                                                        "authority": val[0].authority,
                                                        "unitId": context.params.unitId,
                                                        "birthDay": document.birthDay && document.birthDay.seconds ? moment.unix(document.birthDay.seconds).format('DD/MM/YYYY') : '',
                                                        "whenRegistered": document.whenRegistered && document.whenRegistered.seconds ? moment.unix(document.whenRegistered.seconds).format('DD/MM/YYYY HH:mm:ss') : ''
                                                        });
        return realTimeDB.ref().update(updates)
      });
    });

function getUnits(req, res) {

    return firestore.collection('units')
      .get()
      .then( response => {

        const _units = [];

        response.docs.forEach( (unit) => {

            const unitData = unit.data();

            _units.push({
              name: unitData.name_he,
              concessionaire: unitData.concessionaire,
              symbol: unitData.symbol,
              id: unit.id
            });

        });
        return res.send(_units);
      });
}

function getGroups(req, res) {

    return firestore.collection('units')
      .get()
      .then( response => {

        const _units = [];

        response.docs.forEach( (unit) => {
          const unitId = unit.id;
          _units.push(unitId);
        });

        return _units;

      })
      .then( unitIds => {

        var _promises = [];

        unitIds.forEach( unitId => {
            var _promise = firestore.collection('units/' + unitId + '/groups')
                          .get();
            _promises.push(_promise);
        })

        return Promise.all(_promises)

      })
      .then( groupDocs => {

          const _groups = [];

          groupDocs.forEach( groupDoc => {

            groupDoc.docs.forEach( doc => {

              // This document (doc.ref) belongs to 'groups' collection (doc.ref.parent)
              // that, in turn, has a patent - a 'units' collection (doc.ref.parent.parent).
              // We're interesting it this grandparent's id
              var unitId = doc.ref.parent.parent.id;
              const groupData = doc.data();

              //console.log(JSON.stringify(groupData));

              const unitName = ( groupData.unit ) ? groupData.unit.name_he : '';
              const authority = ( groupData.unit ) ? groupData.unit.authority : '';

              _groups.push({
                unitId: unitId,
                id: doc.id,
                symbol: groupData.symbol,
                name: groupData.name,
                openFrom: moment(groupData.openFrom).format('DD/MM/YYYY'),
                openTill: moment(groupData.openTill).format('DD/MM/YYYY'),
                price: groupData.price,
                capacity: groupData.capacity,
                unitName: unitName.trim(),
                authority: authority.trim()
              });

            });

          });

          return _groups;
      })
}
