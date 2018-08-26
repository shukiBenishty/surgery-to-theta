const firestore = require('./init.js').firestore;
const realTimeDB = require('./init.js').realTimeDB;


exports.unregisterPupil  = (snap, context) => {
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
};

exports.registerPupil = ( document, context) => {
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
    updates[`/pupils/${context.params.pupilId}`] = _spread({}, document.data(), {
                                                    "id": context.params.pupilId,
                                                    "groupId": context.params.groupId,
                                                    "authority": val[0].authority,
                                                    "unitId": context.params.unitId,
                                                    "birthDay": document.data().birthDay && document.data().birthDay.seconds ? moment.unix(document.data().birthDay.seconds).format('DD/MM/YYYY') : '',
                                                    "whenRegistered": document.data().whenRegistered && document.data().whenRegistered.seconds ? moment.unix(document.data().whenRegistered.seconds).format('DD/MM/YYYY HH:mm:ss') : ''
                                                    });
    return realTimeDB.ref().update(updates)
  });
}

exports.updatePupil = (change, context) => {
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
};
