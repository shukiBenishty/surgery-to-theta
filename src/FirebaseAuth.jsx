// @flow
import React from 'react';
import firebase from './firebase.js';
import { connect } from 'react-redux';

type State = {
  secRoles: string[],
  email: string,
  role: string
}


let withAuth = (WrappedComponent) => class extends React.Component<{}, State> {

  state = {
    secRoles: [],
    email: '',
    role: ''
  }

  fetchUser() {
    return new Promise( (resolve, reject) => {
    firebase.auth().onAuthStateChanged( (user) => {
        if( user ) {
          resolve(user)
        } else {
          reject(console.error)
        }
      })
    });
  }

  async componentDidMount() {

    const user = await ::this.fetchUser();
    const email = user.email;

    let response = await firebase.firestore().collection('users')
                                    .where("email", "==", email)
                                    .get();
    if( response.docs.length != 0 ) {
      const docSnapshot = response.docs[0];
      const docData = docSnapshot.data()
      let userRoles = docData.sec_roles;
      const role = docData.role.toLowerCase();

      if( !userRoles ) {
        userRoles = ['']; // assign empty roles
      }

      this.setState({
        secRoles: userRoles,
        email: email,
        isAdmin: role === 'admin' ? true : false
      });
      this.props.dispatch({
        type: 'USER_CHANGED',
        data: {
          secRoles: userRoles,
          email: email,
          isAdmin: role === 'admin' ? true : false
        }
      });

    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.secRoles && nextState.secRoles.length > 0 ? true : false;
  }

  render() {

    return (
              <React.Fragment>
                <WrappedComponent
                  secRoles={this.state.secRoles}
                  userEMail={this.state.email}
                  isAdmin={this.state.isAdmin}
                  {...this.props} />
              </React.Fragment>
            )
  }
}

const mapStateToProps = (state) => {

}

export default connect(mapStateToProps)(withAuth);
