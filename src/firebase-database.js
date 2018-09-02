import firebase from './firebase.js';
import {store} from './index.jsx';
import moment from 'moment';
const uuidv4 = require('uuid/v4');

// var serviceAccount = require("./pupilsM.json");

const unitsRef = firebase.firestore().collection('units');
const authoritiesRef = firebase.firestore().collection('authorities');
const usersRef = firebase.firestore().collection('users');

let RDBunitsRef = firebase.database().ref('units');
let RDBpupilsRef = firebase.database().ref('pupils');
let RDBgroupsRef = firebase.database().ref('groups');
let RDBauthoritiesRef = firebase.database().ref('authorities');
let RDBusersRef = firebase.database().ref('users')

let authorities = {};
let units = {};
let groups = {};
let pupils = {};
let users = {};
let userPermissionsId = '';
let initialized = false;

const trimObjectProperties = (objectToTrim) => {
    for (var key in objectToTrim) {
        if (objectToTrim[key].constructor && objectToTrim[key].constructor == Object)
            trimObjectProperties(objectToTrim[key]);
        else if (objectToTrim[key].trim)
            objectToTrim[key] = objectToTrim[key].trim();
    }
}


// const initAuthorities = () => {
//   authoritiesRef.onSnapshot( _authorities => {
//       _authorities.docChanges().forEach((authority) => {
//         if (authority.type === "removed") {
//           delete authorities[authority.doc.id];
//         }
//         else {
//           authorities[authority.doc.id] = authority.doc.data();
//           authorities[authority.doc.id].metadata = {};
//           authorities[authority.doc.id].metadata.authorityId = authority.doc.id;
//         }
//       })
//       store.dispatch({
//         type: 'AUTHORITIES_CHANGED',
//         data: {
//           authorities: Object.values(authorities)
//         }
//       });
//   })
// }
//
// const initUsers = () => {
//   usersRef.onSnapshot( _users => {
//       _users.docChanges().forEach((user) => {
//         if (user.type === "removed") {
//           delete users[user.doc.id];
//         }
//         else {
//           users[user.doc.id] = user.doc.data();
//           users[user.doc.id].metadata = {};
//           users[user.doc.id].metadata.userId = user.doc.id;
//         }
//       })
//       store.dispatch({
//         type: 'AUTHORITIES_CHANGED',
//         data: {
//           users: Object.values(users)
//         }
//       });
//   })
// }
//
// const checkDB = () => {
//   var updates = {};
//   let count = 0 ;
//   let countError1 = 0 ;
//   let countError2 = 0 ;
//   serviceAccount.forEach(function(pupil) {
//     try {
//       if(pupil.sent_successfully === "ok"){
//         if(pupil.groupSymbol === 416545){
//           countError1++;
//           pupil.groupSymbol = 4165451;
//         }
//         if(pupil.groupSymbol === 713396){
//           countError2++;
//           pupil.groupSymbol = 713369;
//         }
//         let _pupil = {
//           address: "",
//           pupilId: pupil.pupilId,
//           birthDay: moment(pupil.DateOfBirth, "YYYY-MM-DD HH:mm:ss").format('DD/MM/YYYY'), ////
//           name: pupil.name,
//           lastName: pupil.family,
//           parentId: pupil.parentId,
//           phoneNumber: pupil.phoneNumber,
//           whenRegistered: moment(pupil.whenRegistered, "YYYY-MM-DD HH:mm:ss").format('DD/MM/YYYY HH:mm:ss'), ///
//           medicalLimitations: pupil.medicalLimitations,
//           paymentApprovalNumber: pupil.PaymentConfirmationNumber,
//           payerName: pupil.name_pay,
//           registrationSource: pupil.registration_source,
//           status: pupil.status
//         }
//         trimObjectProperties(_pupil);
//         let pupilId = uuidv4();
//         let _group = Object.values(groups).find( group => {
//           return group.symbol == pupil.groupSymbol}
//         )
//         if(_group){
//           count++;
//           _pupil.metadata = {};
//           _pupil.metadata.pupilId = pupilId;
//           _pupil.metadata.groupId = _group.metadata.groupId;
//           _pupil.metadata.unitId = _group.metadata.unitId;
//           _pupil.metadata.authority = _group.metadata.authority;
//           updates[`pupils/${pupilId}`] = _pupil;
//           updates[`groups/${_group.metadata.groupId}/metadata/pupils/${pupilId}`] = pupilId; // { pupilId }
//         }
//
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   });
//   console.log("pupils num:"+ count);
//   console.log("countError1: "+ countError1);
//   console.log("countError2: "+ countError2);
//   firebase.database().ref().update(updates);
//   // console.log(updates);
// };

exports.initDatabase = (permissionsId, role) => {
  if (!initialized) {
    initialized = true;

    try {

      let promises = [];

      if (role.toLowerCase() !== 'admin') {

        RDBunitsRef = RDBunitsRef.orderByChild(`/metadata/permissions/${permissionsId}/read`).equalTo(true);
        RDBpupilsRef = RDBpupilsRef.orderByChild(`/metadata/permissions/${permissionsId}/read`).equalTo(true);
        RDBgroupsRef = RDBgroupsRef.orderByChild(`/metadata/permissions/${permissionsId}/read`).equalTo(true);
        // RDBauthoritiesRef = RDBauthoritiesRef.orderByChild(`/metadata/permissions/${permissionsId}/read`).equalTo(true);
        // RDBusersRef = RDBusersRef.orderByChild(`/metadata/permissions/${permissionsId}/read`).equalTo(true);
      }
      promises.push(RDBunitsRef.on('value', (snapshot) => {
        units = snapshot.val();
          store.dispatch({
            type: 'UNITS_CHANGED',
            data: {
              units: (units) ? Object.values(units) : []
            }
          });
      }));
      promises.push(RDBgroupsRef.on('value', (snapshot) => {
        groups = snapshot.val();
          store.dispatch({
            type: 'GROUPS_CHANGED',
            data: {
              groups: (groups) ? Object.values(groups) : []
            }
          });
      }));
      promises.push(RDBpupilsRef.on('value', (snapshot) => {
        pupils = snapshot.val();
          store.dispatch({
            type: 'PUPILS_CHANGED',
            data: {
              pupils: (pupils) ? Object.values(pupils) : []
            }
          });
      }));
      promises.push(RDBauthoritiesRef.on('value', (snapshot) => {
        authorities = snapshot.val();
          store.dispatch({
            type: 'AUTHORITIES_CHANGED',
            data: {
              authorities: (authorities) ? Object.values(authorities) : []
            }
          });
      }));
      promises.push(RDBusersRef.on('value', (snapshot) => {
        users = snapshot.val();
          store.dispatch({
            type: 'USERS_CHANGED',
            data: {
              users: (users) ? Object.values(users) : []
            }
          });
      }));

      Promise.all(promises).then(()=>{
        // setTimeout( () => {
        //       // checkDB();
        // }, 1000 * 20);

      });
    } catch( err ) {
        console.error(err);
    }
  }
};


// exports.initDatabase =  () => {
//   try {
  //  // firebase.database().ref().set(null);
//      unitsRef.onSnapshot( _units => {
//        _units.docChanges().forEach( (unit) => {
//         if (unit.type === "removed") {
//           delete units[unit.doc.id];
//         }
//         else {
//           let unitData = unit.doc.data();
//           let unitMetadata = {};
//           const unitId = unit.doc.id;
//           const unitName = unitData.name_he;
//           const authority = unitData.authority;
//           unitMetadata.unitId = unitId;
//           unitData.unitName = unitName;
//           let __groups = {};
//           // if (unit.type === "modified") {
//           //   __groups = units[unitId].groups;
//           // }
//           unitMetadata.groups = __groups;
//           units[unitId] = unitData;
//           units[unitId].metadata = unitMetadata;
//           if (unit.type === "added") {
//              unitsRef.doc(unitId).collection('groups')
//               .onSnapshot( _groups => {
//                  _groups.docChanges().forEach( (group) => {
//                   // if (group.type === "removed") {
//                   //   delete groups[group.doc.id];
//                   //   delete units[unitId].groups[group.doc.id];
//                   // }
//                     const groupData = group.doc.data();
//                     const groupId = group.doc.id;
//                     const groupSymbol = groupData.symbol;
//                     let groupMetadata = {};
//                     let __pupils = {};
//                     // if (group.type === "modified") {
//                     //   __pupils = groups[groupId].pupils;
//                     // }
//                     groupMetadata.pupils = __pupils;
//                     groupMetadata.unitId = unitId;
//                     groupMetadata.groupId = groupId;
//                     groupMetadata.authority = authority;
//                     groupData.openTill = groupData.openTill ? moment.unix(groupData.openTill.seconds).format('DD/MM/YYYY') : '';
//                     groupData.openFrom = groupData.openFrom ? moment.unix(groupData.openFrom.seconds).format('DD/MM/YYYY') : '';
//
//                     groups[groupId] = groupData;
//                     groups[groupId].registeredPupils = ( groupData.registeredPupils ) ? groupData.registeredPupils : 0
//                     groups[groupId].metadata = groupMetadata;
//                     if (group.type === "added") {
//                       units[unitId].metadata.groups[groupId] =  groupId ;
//                        unitsRef.doc(unitId)
//                         .collection('groups')
//                         .doc(groupId).collection('pupils')
//                         .onSnapshot( _pupils => {
//                             _pupils.docChanges().forEach( (pupil) => {
//                             // if (pupil.type === "removed") {
//                             //   delete pupils[pupil.doc.id];
//                             //   delete groups[groupId].pupils[pupil.doc.id];
//                             // }
//
//                               const pupilData = pupil.doc.data();
//                               const pupilId = pupil.doc.id;
//                               let pupilMetadata = {};
//                               pupilMetadata.pupilId = pupilId;
//                               pupilMetadata.groupId = groupId;
//                               pupilMetadata.unitId = unitId;
//                               pupilMetadata.authority = authority;
//                               pupilData.birthDay = pupilData.birthDay ? moment.unix(pupilData.birthDay.seconds).format('DD/MM/YYYY') : '';
//                               pupilData.whenRegistered = pupilData.whenRegistered ? moment.unix(pupilData.whenRegistered.seconds).format('DD/MM/YYYY HH:mm:ss') : ''
//                               pupils[pupilId]  = pupilData;
//                               pupils[pupilId].metadata  = pupilMetadata;
//                               // if (pupil.type === "added") {
//                               //   groups[groupId].metadata.pupils[pupilId] = { pupilId }
//                               // }
//                         })
//
//                           store.dispatch({
//                             type: 'PUPILS_CHANGED',
//                             data: {
//                               pupils: Object.values(pupils)
//                             }
//                           });
//
//                       })
//                     }
//                 })
//                   store.dispatch({
//                     type: 'GROUPS_CHANGED',
//                     data: {
//                       groups: Object.values(groups)
//                     }
//                   });
//
//               }
//             )
//           }
//         }
//       })
//         store.dispatch({
//           type: 'UNITS_CHANGED',
//           data: {
//             units: Object.values(units)
//           }
//         });
//     })
//     initAuthorities();
//     initUsers();
//   } catch( err ) {
//       console.error(err);
//   }
//   // setTimeout( () => {
//   //   setupRealDataBase()
//   // }, 1000 * 60);
// };

////////// get all //////////

// Get and return all Pupils
exports.getAllPupils = () => {
  if(pupils){
    return Object.values(pupils);
  }
  return [];
};

// Get and return all Groups
exports.getAllGroups = () => {
  if(groups){
    return Object.values(groups);
  }
  return [];
};

// Get and return all Units
exports.getAllUnits = () => {
  if(units){
    return Object.values(units);
  }
  return [];
};

// Get and return all Users
exports.getAllUsers = () => {
  if(users){
    return Object.values(users);
  }
  return [];
};

// Get and return all Authorities
exports.getAllAuthorities = () => {
  if(authorities){
    return Object.values(authorities);
  }
  return [];
};

// Get and return all Pupils
exports.getAllPupilsInGroup = (groupId) => {
  let _pupils = [];

 if( groups[groupId].metadata.pupils ) {

    Object.values(groups[groupId].metadata.pupils).forEach(( pupilId )=> {
      if (pupils[pupilId]) {
         _pupils.push(pupils[pupilId]);
      }
    });
 }

  return _pupils;
};

// Get and return all Groups
exports.getAllGroupsInUnit = (unitId) => {
  let _groups = [];
  if(units[unitId].metadata.groups){

    Object.values(units[unitId].metadata.groups).forEach(( groupId )=> {
      if (groups[groupId]) {
         _groups.push(groups[groupId]);
      }
    })
  }

  return _groups;
};

// Get and return all Units
exports.getAllUnitsInAuthority = (authorityId) => {
  let _units = [];
  if(authorities[authorityId].metadata.units){
     Object.values(authorities[authorityId].metadata.units).forEach(( unitId )=> {
        if (units[unitId]) {
           _units.push(units[unitId]);
        }
      })
  }

  return units;
};

///////////


// Get and return all Pupils
exports.getPupilById = (pupilId) => {
  if(pupils){
    return pupils[pupilId];
  }
  return {};
};

// Get and return all Groups
exports.getGroupById = (groupId) => {
  if(groups){
    return groups[groupId];
  }
  return {};
};

// Get and return all Units
exports.getUnitById = (unitId) => {
  if(units){
    return units[unitId];
  }
  return {};

};

// Get and return all Users
exports.getAuthorityById = (authorityId) => {
  if(authorities){
    return authorities[authorityId];
  }
  return {};
};

// Get and return all Users
exports.getUserById = (userId) => {
  if( users ){
    return users[userId];
  }
  return {};
};

//////

// Get and return all Pupils
exports.deletePupilById = (unitId, groupId, pupilId) => {
  let updates = {};
  updates[`pupils/${pupilId}`] = null
  updates[`groups/${groupId}/metadata/pupils/${pupilId}`] = null
  if(groups[groupId].registeredPupils){
    updates[`groups/${groupId}/registeredPupils`] = groups[groupId].registeredPupils - 1
  }
  return firebase.database().ref().update(updates);
};

// Get and return all Groups
exports.deleteGroupById = (unitId, groupId) => {
  let updates = {};
  updates[`groups/${groupId}`] = null
  updates[`units/${unitId}/metadata/groups/${groupId}`] = null
  return firebase.database().ref().update(updates);
};

// Get and return all Units
exports.deleteUnitById = (unitId) => {
  let updates = {};
  // for (var groupId in units[unitId].metadata.groups) {
  //   for (var pupilId in groups[groupId].metadata.pupils) {
  //     updates[`pupils/${pupilId}/metadata/unitId`] = null
  //     updates[`pupils/${pupilId}/metadata/permissions`] = null
  //   }
  //   updates[`groups/${groupId}/metadata/unitId`] = null
  //   updates[`groups/${groupId}/metadata/permissions`] = null
  // }
  updates[`units/${unitId}`] = null
  return firebase.database().ref().update(updates);
};

// // Get and return all Users
// const deleteAuthorityById = (authorityId) => {
// };

//////////

// Get and return all Pupils
exports.addPupil = (unitId, groupId, pupil) => {
  trimObjectProperties(pupil);
  let updates = {};
  let unit = units[unitId];
  let pupilId = uuidv4();
  try {
    pupil.whenRegistered = moment().format('YYYY-MM-DD HH:mm:ss');

    pupil.metadata = {};
    pupil.metadata.authority = unit.authority || null;
    pupil.metadata.unitId = unitId;
    pupil.metadata.groupId = groupId;
    pupil.metadata.pupilId = pupilId;
    if(units[unitId].metadata){
      pupil.metadata.permissions = units[unitId].metadata.permissions || null;
    }

    updates[`pupils/${pupilId}`] = pupil;
    updates[`groups/${groupId}/metadata/pupils/${pupilId}`] = pupilId;
    if(groups[groupId].registeredPupils){
      updates[`groups/${groupId}/registeredPupils`] = groups[groupId].registeredPupils + 1;
    }
    return firebase.database().ref().update(updates);
  } catch (e) {
    console.error(e);
  }
};

// Get and return all Groups
exports.addGroup = (unitId, group) => {
  trimObjectProperties(group);
  let updates = {}
  let unit = units[unitId];
  let groupId = uuidv4();
  try {
    group.metadata = {};
    group.metadata.authority = unit.authority || null;
    group.metadata.unitId = unitId;
    group.metadata.groupId = groupId;
    group.registeredPupils = 0;
    if(units[unitId].metadata){
      group.metadata.permissions = units[unitId].metadata.permissions || null;
    }
    updates[`groups/${groupId}`] = group;
    updates[`units/${unitId}/metadata/groups/${groupId}`] = groupId

    return firebase.database().ref().update(updates);
  } catch (e) {
    console.error(e);
  }
};

// Get and return all Units
exports.addUnit = (unit) => {
  trimObjectProperties(unit);
  let updates = {}
  let unitId = uuidv4();
  try {
    unit.metadata = {};
    unit.metadata.authority = unit.authority || null;
    updates[`units/${unitId}`] = unit;
    return firebase.database().ref().update(updates);
  } catch (e) {
    console.error(e);
  }
};

// // Get and return all Users
// const addAuthority = (authority) => {
// };


///////

// Get and return all Pupils
exports.updatePupil = (unitId, oldGroupId, newGroupId, pupilId, pupil) => {
  trimObjectProperties(pupil);
  var updates = {};
  //change group
  if (oldGroupId !== newGroupId) {
      updates[`groups/${oldGroupId}/metadata/pupils/${pupilId}`] = null;
      if(groups[oldGroupId].registeredPupils){
        updates[`groups/${oldGroupId}/registeredPupils`] = groups[oldGroupId].registeredPupils - 1;
      }
      if(groups[newGroupId].registeredPupils){
        updates[`groups/${newGroupId}/registeredPupils`] = groups[newGroupId].registeredPupils + 1;
      }
  }
  pupil.metadata = {};
  pupil.metadata.authority = units[unitId].authority || null;
  pupil.metadata.unitId = unitId;
  pupil.metadata.groupId = newGroupId;
  pupil.metadata.pupilId = pupilId;
  if(units[unitId].metadata){
    pupil.metadata.permissions = units[unitId].metadata.permissions || null;
  }

  updates[`groups/${newGroupId}/metadata/pupils/${pupilId}`] = pupilId;
  updates[`pupils/${pupilId}`] = pupil;

  return firebase.database().ref().update(updates);
};

// Get and return all Groups
exports.updateGroup = (unitId, groupId, group) => {
  trimObjectProperties(group);
  var updates = {};

  group.metadata = {};
  group.metadata.authority = units[unitId].authority || null;
  group.metadata.unitId = unitId;
  group.metadata.groupId = groupId;
  if(units[unitId].metadata){
    group.metadata.permissions = units[unitId].metadata.permissions || null;
  }
  if(groups[groupId].metadata){
    group.metadata.pupils = groups[groupId].metadata.pupils || null;
  }
  updates[`groups/${groupId}`] = group;

  return firebase.database().ref().update(updates);
};

// Get and return all Units
exports.updateUnit = (unitId, unit) => {
  trimObjectProperties(unit);
  unit.metadata = {};
  unit.metadata.authority = unit.authority;
  unit.metadata.unitId = unitId;
  if(units[unitId].metadata){
    unit.metadata.groups = units[unitId].metadata.groups || null;
    unit.metadata.permissions = units[unitId].metadata.permissions || null;
  }
  updates[`units/${unitId}`] = unit;

  return firebase.database().ref().update(updates);
};

// // Get and return all Users
// const updateAuthority = (authorityId , authority) => {
// };




// Get and return all Units
exports.changePermissions = (user, userId) => {
  if (user && userId) {
    firebase.database().ref(`users/${userId}`).update(user);
    //usersRef.doc(userId).update(user);
  }
};


// // Get and return all Units
// exports.changePermissions = (user) => {
//   var updates = {}
//   updates['permissions'] = user.permissions;
//   return usersRef.doc(user.userId).update(updates);
//
// };


// const updatePermissionsForAll = (updates, user, unitId, newPermissions) => {
//   if (unitId === undefined) {
//     console.log('error is hear');
//   }
//   updates[`units/${unitId}/metadata/permissions/${user.metadata.userId}`] = newPermissions
//   for (var groupId in groups){
//     if (groups[groupId].metadata.unitId === unitId) {
//       updates[`groups/${groupId}/metadata/permissions/${user.metadata.userId}`] = newPermissions
//     }
//   }
//   for (var pupilId in pupils){
//     if (pupils[pupilId].metadata.unitId === unitId) {
//       updates[`pupils/${pupilId}/metadata/permissions/${user.metadata.userId}`] = newPermissions
//     }
//   }
//   return updates;
// }

const setupRealDataBase = async () => {
  trimObjectProperties(units);
  trimObjectProperties(groups);
  trimObjectProperties(authorities);
  trimObjectProperties(pupils);
  trimObjectProperties(users);
  await firebase.database().ref('units/').set(units);
  await firebase.database().ref('groups/').set(groups);
  await firebase.database().ref('authorities/').set(authorities);
  await firebase.database().ref('pupils/').set(null);
  await firebase.database().ref('users/').set(users);
}
