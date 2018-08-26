import firebase from './firebase.js';
import {store} from './index.jsx';
import moment from 'moment';

const unitsRef = firebase.firestore().collection('units');
const authoritiesRef = firebase.firestore().collection('authorities');
const usersRef = firebase.firestore().collection('users');

var authorities = {};
var units = {};
var groups = {};
var pupils = {};
var users = {};


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

// const initUsers = () => {
//   usersRef.onSnapshot( _users => {
//       _users.docChanges().forEach((user) => {
//         if (user.type === "removed") {
//           delete users[user.doc.id];
//         }
//         else {
//           users[user.doc.id] = user.doc.data();
//           users[user.doc.id].userId = user.doc.id;
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

exports.initDatabase =  (uid, role) => {
  try {
    let promises = [];
    let RDBunitsRef = firebase.database().ref('units');
    let RDBpupilsRef = firebase.database().ref('pupils');
    let RDBgroupsRef = firebase.database().ref('groups');
    let RDBauthoritiesRef = firebase.database().ref('authorities');
    let RDBusersRef = firebase.database().ref('users')

    if (role.toLowerCase() !== 'admin') {
      RDBunitsRef = RDBunitsRef.orderByChild(`/metadata/permissions/${uid}/read`).equalTo(true);
      RDBpupilsRef = RDBpupilsRef.orderByChild(`/metadata/permissions/${uid}/read`).equalTo(true);
      RDBgroupsRef = RDBgroupsRef.orderByChild(`/metadata/permissions/${uid}/read`).equalTo(true);
      // RDBauthoritiesRef = RDBauthoritiesRef.orderByChild(`/metadata/permissions/${uid}/read`).equalTo(true);
      // RDBusersRef = RDBusersRef.orderByChild(`/metadata/permissions/${uid}/read`).equalTo(true);
    }
    promises.push(RDBunitsRef.on('value', (snapshot) => {
      units = snapshot.val();
      if (units) {
        store.dispatch({
          type: 'UNITS_CHANGED',
          data: {
            units: Object.values(units)
          }
        });
      }
    }));
    promises.push(RDBgroupsRef.on('value', (snapshot) => {
      groups = snapshot.val();
      if (groups) {
        store.dispatch({
          type: 'GROUPS_CHANGED',
          data: {
            groups: Object.values(groups)
          }
        });
      }
    }));
    promises.push(RDBpupilsRef.on('value', (snapshot) => {
      pupils = snapshot.val();
      if (pupils) {
        store.dispatch({
          type: 'PUPILS_CHANGED',
          data: {
            pupils: Object.values(pupils)
          }
        });
      }
    }));
    promises.push(RDBauthoritiesRef.on('value', (snapshot) => {
      authorities = snapshot.val();
      if (authorities) {
        store.dispatch({
          type: 'AUTHORITIES_CHANGED',
          data: {
            authorities: Object.values(authorities)
          }
        });
      }
    }));
    promises.push(RDBusersRef.on('value', (snapshot) => {
      users = snapshot.val();
      if (users) {
        store.dispatch({
          type: 'USERS_CHANGED',
          data: {
            users: Object.values(users)
          }
        });
      }
    }));

    Promise.all(promises);
  } catch( err ) {
      console.error(err);
  }
};


// exports.initDatabase =  () => {
//   try {
//      unitsRef.onSnapshot( _units => {
//        _units.docChanges().forEach( (unit) => {
//         if (unit.type === "removed") {
//           delete units[unit.doc.id];
//         }
//         else {
//           let unitData = unit.doc.data();
//
//           const unitId = unit.doc.id;
//           const unitName = unitData.name_he;
//           const authority = unitData.authority;
//           unitData.unitId = unitId;
//           unitData.unitName = unitName;
//           let __groups = {};
//           if (unit.type === "modified") {
//             __groups = units[unitId].groups;
//           }
//           unitData.groups = __groups;
//           units[unitId] = unitData;
//           if (unit.type === "added") {
//              unitsRef.doc(unitId).collection('groups')
//               .onSnapshot( _groups => {
//                  _groups.docChanges().forEach( (group) => {
//                   if (group.type === "removed") {
//                     delete groups[group.doc.id];
//                     delete units[unitId].groups[group.doc.id];
//                   }
//                   else {
//                     const groupData = group.doc.data();
//                     const groupId = group.doc.id;
//                     const groupSymbol = groupData.symbol;
//                     const groupName = groupData.name;
//                     let __pupils = {};
//                     if (group.type === "modified") {
//                       __pupils = groups[groupId].pupils;
//                     }
//                     groupData.pupils = __pupils;
//                     groupData.unitId = unitId;
//                     groupData.groupName = groupName;
//                     groupData.groupId = groupId;
//                     groupData.openTill = groupData.openTill ? moment.unix(groupData.openTill.seconds).format('DD/MM/YYYY') : '';
//                     groupData.openFrom = groupData.openFrom ? moment.unix(groupData.openFrom.seconds).format('DD/MM/YYYY') : '';
//
//                     groups[groupId] = groupData;
//                     if (group.type === "added") {
//                       units[unitId].groups[groupId] = { groupId };
//                        unitsRef.doc(unitId)
//                         .collection('groups')
//                         .doc(groupId).collection('pupils')
//                         .onSnapshot( _pupils => {
//                             _pupils.docChanges().forEach( (pupil) => {
//                             if (pupil.type === "removed") {
//                               delete pupils[pupil.doc.id];
//                               delete groups[groupId].pupils[pupil.doc.id];
//                             }
//                             else {
//
//                               const pupilData = pupil.doc.data();
//                               const id = pupil.doc.id;
//
//                               pupilData.id = id;
//                               pupilData.groupId = groupId;
//                               pupilData.unitId = unitId;
//                               pupilData.authority = authority;
//                               pupilData.birthDay = pupilData.birthDay ? moment.unix(pupilData.birthDay.seconds).format('DD/MM/YYYY') : '';
//                               pupilData.whenRegistered = pupilData.whenRegistered ? moment.unix(pupilData.whenRegistered.seconds).format('DD/MM/YYYY HH:mm:ss') : ''
//                               pupils[id]  = pupilData;
//
//                               if (pupil.type === "added") {
//                                 groups[groupId].pupils[id] = { "pupilId": id }
//                               }
//
//                           }
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
//                   }
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
//   setTimeout( () => {
//     setupRealDataBase()
//   }, 1000 * 120);
// };

////////// get all //////////

// Get and return all Pupils
exports.getAllPupils = () => {  return Object.values(pupils);  };

// Get and return all Groups
exports.getAllGroups = () => {  return Object.values(groups);  };

// Get and return all Units
exports.getAllUnits = () => { return Object.values(units); };

// Get and return all Users
exports.getAllUsers = () => { return Object.values(users); };

// Get and return all Authorities
exports.getAllAuthorities = () => { return Object.values(authorities); };



///////////// get by fathers //////////////

// Get and return all Pupils
exports.getAllPupilsInGroup = (groupId) => {
    return Object.values(groups[groupId].pupils).map(( pupil )=> {
      return pupils[pupil.pupilId];
    })
};

// Get and return all Groups
exports.getAllGroupsInUnit = (unitId) => {
  return Object.values(units[unitId].groups).map(( group )=> {
    return groups[group.groupId];
  })
};

// Get and return all Units
exports.getAllUnitsInAuthority = (authorityId) => {
  return Object.values(authorities[authorityId].units).map(( unit )=> {
    return units[unit.unitId];
  })
};

///////////


// Get and return all Pupils
exports.getPupilById = (pupilId) => {
  return pupils[pupilId];
};

// Get and return all Groups
exports.getGroupById = (groupId) => {
    return groups[groupId];
};

// Get and return all Units
exports.getUnitById = (unitId) => {
  return units[unitId];
};

// Get and return all Users
exports.getAuthorityById = (authorityId) => {
    return authorities[authorityId];
};

// Get and return all Users
exports.getUserById = (userId) => {
    return users[userId];
};

//////

// Get and return all Pupils
exports.deletePupilById = (unitId, groupId, pupilId) => {
  unitsRef.doc(unitId).collection('groups')
  .doc(groupId).collection('pupils')
  .doc(pupilId)
  .delete();
};

// Get and return all Groups
exports.deleteGroupById = (unitId, groupId) => {
  unitsRef.doc(unitId).collection('groups')
  .doc(groupId)
  .delete();
};

// Get and return all Units
exports.deleteUnitById = (unitId) => {
  unitsRef.doc(unitId)
  .delete();
};

// // Get and return all Users
// const deleteAuthorityById = (authorityId) => {
// };

//////////

// Get and return all Pupils
exports.addPupil = (unitId, groupId, pupil) => {
  unitsRef.doc(unitId).collection('groups')
    .doc(groupId).collection('pupils')
    .add(pupil)
};

// Get and return all Groups
exports.addGroup = (unitId, group) => {
  unitsRef.doc(unitId)
          .collection('groups')
          .add(group);
};

// Get and return all Units
exports.addUnit = (unit) => {
  unitsRef.add(unit);
};

// // Get and return all Users
// const addAuthority = (authority) => {
// };


///////

// Get and return all Pupils
exports.updatePupil = (unitId, groupId, pupilId, pupil) => {
  unitsRef.doc(unitId).collection('groups')
    .doc(groupId).collection('pupils')
    .doc(pupilId)
    .update(pupil)
};

// Get and return all Groups
exports.updateGroup = (unitId, groupId, group) => {
  unitsRef.doc(unitId).collection('groups')
    .doc(groupId)
    .update(group)
};

// Get and return all Units
exports.updateUnit = (unitId, unit) => {
  unitsRef.doc(unitId)
    .update(unit)
};

// // Get and return all Users
// const updateAuthority = (authorityId , authority) => {
// };




// // Get and return all Units
// exports.changePermissions = (user) => {
//   const permissionsRef = usersRef.doc(user.userId).collection('permissions');
  
//   if(!users[user.userId].permissions){
//     users[user.userId].permissions = {};
//   }
//   var batch = firebase.firestore().batch();

//   for (var unitId in users[user.userId].permissions){
//     if (user.permissions[unitId] !== undefined) {
//       batch.update(permissionsRef.doc(unitId), user.permissions[unitId]);
//     } else {
//       batch.delete(permissionsRef.doc(unitId));
//     }
//   }
//   for (var unitId in units){
//     if (user.permissions[unitId] !== undefined && 
//         users[user.userId].permissions[unitId] === undefined) {
//       batch.set(permissionsRef.doc(unitId), user.permissions[unitId])
//     }
//   }
//   return batch.commit();
// };


// Get and return all Units
exports.changePermissions = (user) => {
  var updates = {}
  updates['permissions'] = user.permissions;
  return usersRef.doc(user.userId).update(updates);
  
};


const setupRealDataBase = async () => {
  trimObjectProperties(units);
  trimObjectProperties(groups);
  trimObjectProperties(authorities);
  trimObjectProperties(pupils);
  trimObjectProperties(users);
  await firebase.database().ref('units/').set(units);
  await firebase.database().ref('groups/').set(groups);
  await firebase.database().ref('authorities/').set(authorities);
  await firebase.database().ref('pupils/').set(pupils);
  await firebase.database().ref('users/').set(users);
}
