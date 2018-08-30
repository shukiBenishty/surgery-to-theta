const firestore = require('./init.js').firestore;
const realTimeDB = require('./init.js').realTimeDB;

// users/{userId}/permissions/{unitsId}
exports.permissionsDeleted  = (snap, context) => {
  console.log(`onDelete user: ${context.params.userId} permissions to unit:  ${context.params.unitsId} `);
  var promises = [];
  var updates = {};
  updates[`units/${context.params.unitsId}/metadata/permissions/${context.params.userId}`] = null;
  promises.push(realTimeDB.ref('groups')
    .orderByChild(`/unitId`).equalTo(`${context.params.unitsId}`)
    .once('value').then((snapshot) =>  {
      snapshot.forEach( (group) => {
        updates[`groups/${group.key}/metadata/permissions/${context.params.userId}`] = null;
      })
      return true;
    })
  );
  promises.push(realTimeDB.ref('pupils')
  .orderByChild(`/unitId`).equalTo(`${context.params.unitsId}`)
  .once('value').then((snapshot) =>  {
    snapshot.forEach((pupil) => {
      updates[`pupils/${pupil.key}/metadata/permissions/${context.params.userId}`] = null;
    })
    return true;
  }));
  return Promise.all(promises).then(() =>{
        return realTimeDB.ref().update(updates)
  })
};

exports.permissionsAdded = ( document, context) => {
  console.log(`onAdded user: ${context.params.userId} permissions`);
  var promises = [];
  var updates = {};
  updates[`units/${context.params.unitsId}/metadata/permissions/${context.params.userId}`] = document.data();
  promises.push(realTimeDB.ref('groups')
  .orderByChild(`/unitId`).equalTo(`${context.params.unitsId}`)
  .once('value').then((snapshot) =>  {
    snapshot.forEach((group) => {
      updates[`groups/${group.key}/metadata/permissions/${context.params.userId}`] = document.data();
    })
    return true;
  }));
  promises.push(realTimeDB.ref('pupils')
  .orderByChild(`/unitId`).equalTo(`${context.params.unitsId}`)
  .once('value').then((snapshot) =>  {
    snapshot.forEach((pupil) => {
      updates[`pupils/${pupil.key}/metadata/permissions/${context.params.userId}`] = document.data();
    })
    return true;
  }));
  return Promise.all(promises).then(() =>{
      console.log(updates);
      return realTimeDB.ref().update(updates)
  })
}

exports.permissionsUpdate = (change, context) => {
  console.log(`onUpdate  user: ${context.params.userId} permissions`);

  const document = change.after.data();
  var promises = [];
  var updates = {};
  updates[`units/${context.params.unitsId}/metadata/permissions/${context.params.userId}`] = document;
  promises.push(realTimeDB.ref('groups')
  .orderByChild(`/unitId`).equalTo(`${context.params.unitsId}`)
  .once('value').then((snapshot) =>  {
    snapshot.forEach((group) => {
      updates[`groups/${group.key}/metadata/permissions/${context.params.userId}`] = document;
    })
    return true;
  }));
  promises.push(realTimeDB.ref('pupils')
  .orderByChild(`/unitId`).equalTo(`${context.params.unitsId}`)
  .once('value').then((snapshot) =>  {
    snapshot.forEach((pupil) => {
      updates[`pupils/${pupil.key}/metadata/permissions/${context.params.userId}`] = document;
    })
    return true;
  }));
  return Promise.all(promises).then(() =>{
        return realTimeDB.ref().update(updates)
  })

};
