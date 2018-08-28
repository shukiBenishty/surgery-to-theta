import _ from 'lodash';

const INITIAL_STATE = {
  permissions: {},
  users: [],
  secRoles: [''],
  email: '',
  isAdmin: false,
  authorities: [],
  pupils: [],
  pupilsLoaded: false,
  units: [],
  groups: [],
  userName: '',
  userPictureUrl: '',
  pageName: ''
};


const reducers = (state = INITIAL_STATE, action) => {

  switch( action.type ) {

    case 'LOGIN': {
        state = _.assign({}, state, {
                                      email: action.data.email,
                                      userName: action.data.userName,
                                      userPictureUrl: action.data.userPictureUrl,
                                    });
    }
    break;

    case 'LOGOUT': {
      state = _.assign({}, state, {
                                    userName: '',
                                    userPictureUrl: ''
                                  });
    }
    break;

    case 'USER_CHANGED': {
      state = _.assign({}, state, {
                                    secRoles: action.data.secRoles,
                                    permissions: action.data.permissions,
                                    email: action.data.email,
                                    isAdmin: action.data.isAdmin
                                  });
    }
    break;

    case 'UNITS_CHANGED': {
      state = _.assign({}, state, {
                                    units: action.data.units
                                  });
    }
    break;

    case 'GROUPS_CHANGED': {
      state = _.assign({}, state, {
                                    groups: action.data.groups
                                  });
    }
    break;

    case 'PUPILS_CHANGED': {
      state = _.assign({}, state, {
                                    pupils: action.data.pupils,
                                    pupilsLoaded: true
                                  });
    }
    break;

    case 'AUTHORITIES_CHANGED': {
      state = _.assign({}, state, {
                                    authorities: action.data.authorities
                                  });
    }
    break;

    case 'USERS_CHANGED': {
      state = _.assign({}, state, {
                                    users: action.data.users
                                  });
    }
    break;

    case 'PAGE_NAVIGATED': {
      state = _.assign({}, state, {
                                    pageName: action.data.pageName
                                  });
    }
    break;
  }

  return state;

};

export default reducers;
