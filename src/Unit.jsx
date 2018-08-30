// @flow
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import firebase from './firebase.js';
import { Button, Row, Col, Input,
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';

import UnitUpdates from './UnitUpdates';
import UnitGroups from './UnitGroups';
import database from './firebase-database.js'

type State = {
  unit: {
    unitName: String,
    authority: String,
    concessionaire: String,
    symbol: String,
    type: String,
    education_type: String,
    long_day_permit: Boolean,
    status: String
  },
  unitId: String,
}

type Props = {
  unitId: String
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.isAdmin
  }
}


@withRouter
@connect(mapStateToProps)
export default
class Unit extends React.Component<Props, State> {

  state = {
    unit: {
      unitName: '',
      authority: '',
      concessionaire: '',
      symbol: '',
      type: '',
      education_type: '',
      long_day_permit: false,
      status: ''
    },
    unitId: '',
  }

  async componentDidMount() {
     await this._loadData(this.props.unitId);
  }

  async componentDidUpdate(prevProps, prevState) {

    if( prevProps.unitId !== this.props.unitId ) {
      await this._loadData(this.props.unitId)
    }

  }



  async _loadData(unitId: String) {

    if( unitId !== this.props.id ) {
      this.setState({
        unit: database.getUnitById(unitId),
        unitId: unitId
      });
    }

  }

  addGroup() {
      this.props.history.push(`/dashboard/addgroup/${this.props.unitId}/0`);
  }

  render() {

    // No changes are permitted for uncontrolled inputs within this form.
    // Accordingly, we use'value' prop for these inputs set to the appropriate
    // values in state. Such design does not allow actual reflecting user typing.
    // It seems better that making all input disabled.
    // If you wabt to enable changes for some input, provide 'defaultValue' props
    // provide ref for such input and set its the 'value' after getting
    // docDate from firebase

    return <div>
              <div className='card'>
                <ul className='nav nav-tabs lustify-content-center' role='tablist'>
                  <li className='nav-item'>
                    <a className='nav-link nav-tab active' data-toggle='tab' href='#groups'
                      role='tab' area-expanded='false'>
                          <i className='now-ui-icons education_hat'
                              style={{
                                verticalAlign: 'middle'
                              }}></i>
                          <span>&nbsp;כיתות</span>
                    </a>
                  </li>
                  <li className='nav-item'>
                    <a className='nav-link nav-tab' data-toggle='tab' href='#updates'
                      role='tab' area-expanded='false'>
                          <i className='now-ui-icons ui-1_calendar-60'
                             style={{
                                verticalAlign: 'middle'
                             }}></i>
                           <span>&nbsp;עדכונים</span>
                    </a>
                  </li>
                  <li className='nav-item'>
                    <a className='nav-link nav-tab' data-toggle='tab' href='#general'
                        role='tab' area-expanded='true'>
                          <i className='now-ui-icons ui-2_settings-90'
                              style={{
                                verticalAlign: 'middle'
                              }}></i>
                            <span>&nbsp;הגדרות כלליות</span>
                    </a>
                  </li>
                </ul>
                <div className='card-body'>
                  <div className='tab-content text-center'>
                    <div id='general' className='tab-pane' role='tabpanel'>
                      <Row>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label'>שם</label>
                          <div>{this.state.unit.unitName}</div>
                        </Col>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label'>רשות</label>
                          <div>{this.state.unit.authority}</div>
                        </Col>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label active-label '>זכיין</label>
                          <div>{this.state.unit.concessionaire}</div>
                        </Col>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label'>סמל</label>
                          <div>{this.state.unit.symbol}</div>
                        </Col>
                      </Row>
                      <br />
                      <Row>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label'>סוג</label>
                          <div>{this.state.unit.type}</div>
                        </Col>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label'>סוג חינוך</label>
                          <div>{this.state.unit.education_type}</div>
                        </Col>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label'>אישור יוח"א</label>
                          <Input type='radio' checked readOnly value={this.state.unit.long_day_permit}
                                className='form-control'/>
                        </Col>
                        <Col md='3' className='text-left'>
                          <label className='form-control-label'>סטאטוס</label>
                          <div>{this.state.unit.status}</div>
                        </Col>
                      </Row>
                    </div>
                    <div id='updates' className='tab-pane' role='tabpanel'>
                      <UnitUpdates unitId={this.props.unitId} />
                    </div>
                    <div id='groups' className='tab-pane active' role='tabpanel'>

                        <div className="card card-body">
                          <div className='row'>
                              <div className='col col-12 d-flex justify-content-end'>
                              <Button color='primary'
                                      className='align-self-end'
                                      onClick={::this.addGroup}
                                      disabled={!this.props.isAdmin}>
                                      <span>הוסף כיתה </span><i className="fa fa-plus-circle" aria-hidden="true"></i>
                              </Button>
                              </div>
                          </div>
                          <UnitGroups unitId={this.props.unitId} />

                        </div>

                    </div>
                  </div>
                </div>
              </div>
           </div>
  }

}
