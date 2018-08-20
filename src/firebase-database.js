import firebase from './firebase.js';
import {store} from './index.jsx';

let initMode = true;
const unitsRef = firebase.firestore().collection('units');
const authoritiesRef = firebase.firestore().collection('authorities');
const groupsRefs =[];
const pupilsRefs =[];
const usersRef = firebase.firestore().collection('users')

var authorities = {};
var units = {};
var groups = {};
var pupils = {};
var users = {};


const initAuthorities = () => {
  authoritiesRef.onSnapshot( _authorities => {
      _authorities.docChanges().forEach((authority) => {
        if (authority.type === "removed") {
          delete authorities[authority.doc.id];
        }
        else {
          authorities[authority.doc.id] = authority.doc.data();
        }
      })
      store.dispatch({
        type: 'AUTHORITIES_CHANGED',
        data: {
          authorities: Object.values(authorities)
        }
      });
  })
}

exports.initDatabase =  () => {
  try {
     unitsRef.onSnapshot(async _units => {
      await _units.docChanges().forEach( (unit) => {
        if (unit.type === "removed") {
          delete units[unit.doc.id];
        }
        else {
          let unitData = unit.doc.data();

          //const sec_role =  unitData.sec_role;
          const unitId = unit.doc.id;
          const unitName = unitData.name_he;
          const unitSymbol = unitData.symbol;
          const authority = unitData.authority;
          unitData.unitId = unitId;
          let __groups = [];
          if (unit.type === "modified") {
            __groups = units[unitId].groups;
          }
          unitData.groups = __groups;
          units[unitId] = unitData;
          if (unit.type === "added") {
             unitsRef.doc(unitId).collection('groups')
              .onSnapshot( _groups => {
                 _groups.docChanges().forEach(async (group) => {
                  if (group.type === "removed") {
                    delete groups[group.doc.id];
                  }
                  else {
                    const groupData = group.doc.data();
                    const groupId = group.doc.id;
                    const groupSymbol = groupData.symbol;
                    const groupName = groupData.name;
                    let __pupils = [];
                    if (group.type === "modified") {
                      __pupils = groups[groupId].pupils;
                    }
                    groupData.unitId = unitId;
                    groupData.unitName = unitName;
                    groupData.groupId = groupId;
                    groupData.pupils = __pupils;
                    groups[groupId] = groupData;
                    if (group.type === "added") {
                      units[unitId].groups.push(groupId);
                       unitsRef.doc(unitId)
                        .collection('groups')
                        .doc(groupId).collection('pupils')
                        .onSnapshot( _pupils => {
                            _pupils.docChanges().forEach( (pupil) => {
                            if (pupil.type === "removed") {
                              delete pupils[pupil.doc.id];

                            }
                            else {

                              const pupilData = pupil.doc.data();
                              const id = pupil.doc.id;

                              pupilData.id = id;
                              pupilData.groupId = groupId;
                              pupilData.groupSymbol = groupSymbol;
                              pupilData.unitId = unitId;
                              pupilData.unitName = unitName;
                              pupilData.authority = authority;
                              pupilData.groupName = groupName;
                              pupils[id]  = pupilData;

                              if (pupil.type === "added") {
                                groups[groupId].pupils.push(id);
                              }

                          }
                        })

                          store.dispatch({
                            type: 'PUPILS_CHANGED',
                            data: {
                              pupils: Object.values(pupils)
                            }
                          });

                      })
                    }
                  }
                })
                  store.dispatch({
                    type: 'GROUPS_CHANGED',
                    data: {
                      groups: Object.values(groups)
                    }
                  });

              }
            )
          }
        }
      })   
        store.dispatch({
          type: 'UNITS_CHANGED',
          data: {
            units: Object.values(units)
          }
        });
    })
    initAuthorities();
  } catch( err ) {
      console.error(err);
  }
 
};

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
    return groups[groupId].pupils.map(( pupilId )=> {
      return pupils[pupilId];
    })
};

// Get and return all Groups
exports.getAllGroupsInUnit = (unitId) => {
  return units[unitId].groups.map(( groupId )=> {
    return groups[groupId];
  })
};

// Get and return all Units
exports.getAllUnitsInAuthority = (authorityId) => {
  return units[unitId].groups.map(( groupId )=> {
    return groups[groupId];
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
