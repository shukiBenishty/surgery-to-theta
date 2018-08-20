// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { HashRouter as Router}  from 'react-router-dom';

import reducers from './reducers';
import App from './App';

const store = createStore(reducers,
      window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

ReactDOM.render(<Provider store={store}>
                  <Router>
                    <App />
                  </Router>
                </Provider>,
                document.getElementById('root'));

exports.store = store;
