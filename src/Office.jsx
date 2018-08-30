// @flow
import React from 'react';
import { connect } from 'react-redux';
import firebase from './firebase.js';

import { Container, Row, Col,
  Card, CardHeader, CardBody, CardText, CardTitle, CardFooter
} from 'reactstrap';


type State = {
  subActivities: []
}

@connect()
export default
class Office extends React.Component<{}, State>  {

  state = {
    subActivities: []
  }

  componentDidMount() {
    const getOptions = {
      source: 'server'
    }

    const self = this;

    firebase.firestore().collection('activities')
      .get(getOptions)
      .then( response => {

        response.docs.forEach( (activity) => {
          if( activity.data().name === 'משרד' ) {

            const subActivities = [];

            activity.ref.collection('sub_activities')
            .get(getOptions)
            .then( resp => {

              resp.docs.forEach( (subActivity) => {
                const activityData = subActivity.data();
                subActivities.push({
                  name: activityData.name,
                  link: activityData.link,
                  description: activityData.description
                });
              });

              self.setState({
                subActivities: subActivities
              });

            })

          }
        });


      })
  }

  activitySelected(activityName: String) {

    this.props.dispatch({
      type: 'PAGE_NAVIGATED',
      data: {
        pageName: activityName
      }
    });

  }

  render() {
    return <div>
              <div className='panel-header panel-header-sm'></div>
              <div className='content container h-100'>
                <Row>
                  <div className='col col-md-12'>
                    <Card body>
                      <CardHeader>
                        <h5 className='title'>רישום ומנהלה</h5>
                      </CardHeader>
                      <div className='card-body'>
                        <Row>
                          {
                            this.state.subActivities.map(( activity, index) => {
                              return (
                                <Col xs='3' key={index}>
                                  <Card body outline>
                                    <CardBody>
                                      <div>
                                        <a onClick={ () => ::this.activitySelected(activity.name) }
                                            href={activity.link}>
                                          <CardTitle>{activity.name}</CardTitle>
                                        </a>
                                      </div>
                                    </CardBody>
                                    <a className='card-footer-link'
                                        onClick={ () => ::this.activitySelected(activity.name) }
                                        href={activity.link}>
                                      <CardFooter className='card-footer'>
                                            {activity.description}
                                      </CardFooter>
                                    </a>
                                  </Card>
                                </Col>
                              )
                            })
                          }
                        </Row>
                      </div>
                    </Card>
                  </div>
                </Row>
              </div>
           </div>
  }

}
