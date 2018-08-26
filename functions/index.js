const functions = require('./init.js').functions;
const firestore = require('./init.js').firestore;
const realTimeDB = require('./init.js').realTimeDB;

const pupilsFunctions = require('./pupils.js');
const permissionsFunctions = require('./permissions.js');

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



// exports.users = functions.https.onRequest((req, res) => {
//     let promises = [];
//     let promises2 = [];
//     let promises3 = [];
//
//     promises.push(firestore.collection('users')
//       .get()
//       .then( (_users) => {
//         _users.docs.forEach( (user) => {
//           const _user = user.data();
//           console.log(_user);
//           console.log(`user name: ${_user.last_name}, email: ${_user.email}`);
//           promises2.push(admin.auth()
//             .getUserByEmail(_user.email.trim())
//             .then( (userRecord ) => {
//                 console.log(`found uid:${userRecord.uid} for: ${_user.last_name}`);
//                 promises3.push(firestore.collection('users')
//                             .doc(user.id).delete()
//                             .then(() => {
//                               return console.log(`user name: ${_user.last_name} with Id: ${user.id} was delete`);
//                             })
//                             .catch((e) => {
//                               console.error(`error while try to delete user name: ${_user.last_name} with Id: ${user.id} was delete`);
//                             }));
//                   promises3.push(firestore.collection('users')
//                             .doc(userRecord.uid)
//                             .set(_user)
//                             .then( () => {
//                               return console.log(`add user name: ${_user.last_name} with Id: ${user.id} ${_user}`);
//                             })
//                             .catch((e) => {
//                               console.error(`error while try to add user name: ${_user.last_name} with Id: ${user.id} was delete -- ${e}`);
//                             }));
//                   return true;
//                 })
//                 .catch((e) => {
//                   console.error(`error while try get Auth info for user ${_user.last_name} name:  Id: ${user.id} was delete -- ${e}`);
//                 })
//               );
//             }
//           )
//           return true;
//         }
//       )
//       )
//        return Promise.all(promises).then(() => {
//         return Promise.all(promises2).then(() => {
//           return Promise.all(promises3).then(() => {
//               return res.status(200).send(`success`);
//           })
//         })
//       })
//     }
//   );

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
                            .onDelete(pupilsFunctions.unregisterPupil)

exports.registerPupil =  functions.firestore
                             .document('units/{unitId}/groups/{groupId}/pupils/{pupilId}')
                             .onCreate( pupilsFunctions.registerPupil);

exports.updatePupil = functions.firestore
                             .document('units/{unitId}/groups/{groupId}/pupils/{pupilId}')
                             .onUpdate(pupilsFunctions.updatePupil)


exports.permissionsDeleted  = functions.firestore
                           .document('users/{userId}/permissions/{unitsId}')
                           .onDelete( permissionsFunctions.permissionsDeleted )

exports.permissionsAdded =  functions.firestore
                            .document('users/{userId}/permissions/{unitsId}')
                            .onCreate( permissionsFunctions.permissionsAdded );


exports.permissionsUpdate = functions.firestore
                            .document('users/{userId}/permissions/{unitsId}')
                            .onUpdate( permissionsFunctions.permissionsUpdate )

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
