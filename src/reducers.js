import _ from 'lodash';

const INITIAL_STATE = {
  secRoles: [''],
  email: '',
  isAdmin: false,
  pupils: [],
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
                                    secRoles: action.data.userRoles,
                                    email: action.data.email,
                                    isAdmin: action.data.isAdmin
                                  });
    }

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
                                    pupils: action.data.pupils
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
