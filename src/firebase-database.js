import firebase from './firebase.js';
import {store} from './index.jsx';
import moment from 'moment';

const unitsRef = firebase.firestore().collection('units');
const authoritiesRef = firebase.firestore().collection('authorities');
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
     unitsRef.onSnapshot( _units => {
       _units.docChanges().forEach( (unit) => {
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
          unitData.unitName = unitName;
          let __groups = [];
          if (unit.type === "modified") {
            __groups = units[unitId].groups;
          }
          unitData.groups = __groups;
          units[unitId] = unitData;
          if (unit.type === "added") {
             unitsRef.doc(unitId).collection('groups')
              .onSnapshot( _groups => {
                 _groups.docChanges().forEach( (group) => {
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
                    groupData.groupName = groupName;
                    groupData.unitName = unitName;
                    groupData.groupId = groupId;
                    groupData.openTill = groupData.openTill ? moment.unix(groupData.openTill.seconds).format('DD/MM/YYYY') : '';
                    groupData.openFrom = groupData.openFrom ? moment.unix(groupData.openFrom.seconds).format('DD/MM/YYYY') : '';
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
                              pupilData.birthDay = pupilData.birthDay ? moment.unix(pupilData.birthDay.seconds).format('DD/MM/YYYY') : '';
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
  setTimeout( () => {
    setupRealDataBase()
  }, 1000 * 120);
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
  return Promise. units[unitId].groups.map(( groupId )=> {
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

const setupRealDataBase = async () => {
  await firebase.database().ref('units/').set(units);
  await firebase.database().ref('groups/').set(groups);
  await firebase.database().ref('authorities/').set(authorities);
  await firebase.database().ref('pupils/').set(pupils);
}
