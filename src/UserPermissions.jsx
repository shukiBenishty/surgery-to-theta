// @flow
import React from 'react';
import { connect } from 'react-redux';
import firebase from './firebase.js';
import { Card, CardHeader, CardBody,
  Row, Col, Button,
  Tooltip } from 'reactstrap';
import DropdownList from 'react-widgets/lib/DropdownList';
import classNames from 'classnames';
import database from './firebase-database.js'

type State = {
  units: String[],
  groupRoles: String[],
  selectedGroup: String,
  selectedUnit: String,
  allowGroupDelete: Boolean,
  groupDeleteTooltipOpen: Boolean,
  allowUnitDelete: Boolean,
  saveChangingTooltipOpen: Boolean,
  unitsDisabled: Boolean,
  role: String,
  toggleButtonText: String
}

const deepCopy = (mainObj) => {
  let objCopy = {};
  let key;

  for (key in mainObj) {
    objCopy[key] = mainObj[key];
  }
  return objCopy;
}

const mapStateToProps = (state) => {
  return {
    users: state.users,
    units: state.units
  }
}

@connect(mapStateToProps)
class UserPermissions extends React.Component<{}, State> {

  state = {
    readForAll: false,
    writeForAll: false,
    unitsListOpen: true,
    units: [],
    groupRoles: [],
    selectedGroup: '',
    selectedUnit: '',
    allowGroupDelete: false,
    groupDeleteTooltipOpen: false,
    allowUnitDelete: false,
    saveChangingTooltipOpen: false,
    unitsDisabled: false,
    role: undefined,
    toggleButtonText: 'בטל'
  }

  componentDidMount() {

      const _user  = database.getUserById(this.props.userId);
      let roleLabel = _user.role === 'admin' ? 'מנהל' : 'משתמש';

      this.setState({
        users: this.props.users,
        userId: this.props.userId,
        user: deepCopy(_user),
        units: this.props.units,
        role: {
          label: roleLabel,
          role: _user.role
        }
      });
   }

   shouldComponentUpdate(nextProps, nextState) {
     if (nextProps.users[this.props.userId] !== this.props.users[this.props.userId]) {
       this.setState({
         users: nextProps.users,
         user: deepCopy(database.getUserById(this.props.userId))
       })
     }

     if (nextState !== this.state) {
       return true;
     } else {
       return false;
     }
   }


  openCloseUnitsList = () => {

    this.setState({
      unitsListOpen: !this.state.unitsListOpen
    })

  }

  roleChange = (item) => {
    this.setState({
      role: item,
      unitsDisabled: (item.role === 'admin')? true: false
    })
  }

  saveRoleChanging(){
      console.log("save changing");
  }

  saveChanging(){
    console.log("save changing");
  }

  toogleSaveChangingTooltip(ev) {

    this.setState({
      saveChangingTooltipOpen: !this.state.saveChangingTooltipOpen
    });
  }

  onSave() {

    this.setState({
      unitsListOpen: false
    },
    () => database.changePermissions(this.state.user, this.props.userId));

  }

  onCancel() {

    this.setState({
      unitsListOpen: !this.state.unitsListOpen,
    }, () => {

      let buttonText = this.state.unitsListOpen ? 'בטל' : 'פתח';
      this.setState({
        toggleButtonText: buttonText
      });

    });
  }

  ListUnits = ({item}) => {
    let textStyle = {}
    if (item.symbol === "סמל מוסד") {
      textStyle ={
        fontWeight: "bold",
        paddingTop: "7px",
        paddingRight: "8px"
      };
    }
    let self = this;

    let readSelected = (e) => {
        let user = self.state.user;
        let readForAll = self.state.readForAll;
        user.permissions = (user.permissions) ? user.permissions : {};
        if (item.symbol !== "סמל מוסד") {
          user.permissions[item.metadata.unitId] = (user.permissions[item.metadata.unitId]) ? user.permissions[item.metadata.unitId] : {};
          user.permissions[item.metadata.unitId].read = e.target.checked;
        } else {
          readForAll = e.target.checked;
          self.props.units.forEach((unit)=>{
            user.permissions[unit.metadata.unitId] = (user.permissions[unit.metadata.unitId]) ? user.permissions[unit.metadata.unitId] : {};
            user.permissions[unit.metadata.unitId].read = e.target.checked;
          })
        }
        self.setState({
          user: user,
          saveChangingTooltipOpen: true,
          readForAll: readForAll
      })
    }

    let writeSelected = (e) => {

      let user = self.state.user;
      let writeForAll = self.state.writeForAll;
      user.permissions = (user.permissions) ? user.permissions : {};
      if (item.symbol !== "סמל מוסד") {
        user.permissions[item.metadata.unitId] = (user.permissions[item.metadata.unitId]) ? user.permissions[item.metadata.unitId] : {};
        user.permissions[item.metadata.unitId].write = e.target.checked;
        user.permissions[item.metadata.unitId].read = e.target.checked;
      } else {
        writeForAll = e.target.checked;
        self.props.units.forEach((unit)=>{
          user.permissions[unit.metadata.unitId] = (user.permissions[unit.metadata.unitId]) ? user.permissions[unit.metadata.unitId] : {};
          user.permissions[unit.metadata.unitId].write = e.target.checked;
        })
      }
      self.setState({
        user: user,
        saveChangingTooltipOpen: true,
        writeForAll: writeForAll
    })
    }

    let read = false;
    let write = false;
    if (item.symbol === "סמל מוסד" ) {
      read = self.state.readForAll,
      write = self.state.writeForAll
    }else if (self.state.user &&
        self.state.user.permissions && self.state.user.permissions[item.metadata.unitId]) {
          read = (self.state.user.permissions[item.metadata.unitId].read ) ? true : false;
          write = (self.state.user.permissions[item.metadata.unitId].write ) ? true : false;
    }

    return (
      <Row>
        <Col md='3'>
          <strong style={textStyle}>{item.symbol}</strong>
        </Col>
        <Col md='3'>
          <strong  style={textStyle}>{item.unitName}</strong>
        </Col>
        <Col md='2'>
          <label>קריאה</label>
        </Col>
        <Col md='1'>
          <input  className='form-check-input'
            id="read"
            checked={read}
            type="checkbox"
            onChange={readSelected}
            className='checkbox'/>
        </Col>
        <Col md='2'>
          <label>כתיבה</label>
        </Col>
        <Col md='1'>
          <input  className='form-check-input'
            id="write"
            checked={write}
            onChange={writeSelected}
            type="checkbox"
            className='checkbox'/>
        </Col>
      </Row>);
  }


  render() {


    let ListGroups = ({ item }) => (
      <span>
        <strong>{item.substr(6, item.length)}</strong>
      </span>
    );


    let filterUnitName = (item, value) => {
      return item.symbol.indexOf(value) === 0
      || item.unitName.indexOf(value) === 0
      || item.authority.indexOf(value) === 0;
    }

    const saveChanging = classNames({
      'd-none': !this.state.allowUnitDelete,
      'fa': true,
      'fa-trash': true
    });

    let GroupHeading = ({ item }) => (
      <span>{'רשות: ' + item}</span>
    );

    return(
      <Card>
        <CardHeader>
          <h6 className='title'>ניהול הרשאות</h6>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md='4'>
              <label className='form-control-label'>תפקיד</label>
            </Col>
            <Col md='8'>
              <label className='form-control-label'>מוסדות</label>
            </Col>
          </Row>
          <Row>
            <Col md='3'>
              <DropdownList
                  placeholder='בחר התפקיד'
                  isRtl={true}
                  value={this.state.role}
                  data={[
                          {label:"משתמש" , role: "user"},
                          {label:"מנהל", role: "admin"}
                        ]}
                  textField="label"
                  onChange={::this.roleChange}
                  />
            </Col>
            <Col md='7'>
              <DropdownList
                  filter={filterUnitName}
                  itemComponent={this.ListUnits}
                  valueComponent={this.ListUnits}
                  value={{"symbol": "סמל מוסד", "unitName": "שם מוסד"}}
                  open={this.state.unitsListOpen}
                  onToggle={ ()=>{}}
                  data={this.state.units}
                  groupBy="authority"
                  groupComponent={GroupHeading}
                  disabled={this.state.unitsDisabled}
                  messages={{
                    emptyFilter: 'לא נמצאו תוצאות סינון',
                    filterPlaceholder: 'סנן לפי שם מוסד, סמל מוסד או רשות'
                  }}
                  />
            </Col>
            <Col md='2' id='unitTooltipContainer' style={{
                lineHeight: '2.1em',
                paddingRight: '0',
                textAlign: 'start'
              }}>
                <Row>
                  <Col md='3'>
                    <button type='button'
                            className='btn-outline-primary'
                            onClick={::this.onSave}>
                      שמור
                    </button>
                  </Col>
                  <Col md='3'>
                    <button type='button'
                            className='btn-outline-primary'
                            onClick={::this.onCancel}>
                          {this.state.toggleButtonText}
                    </button>
                  </Col>
                </Row>
            </Col>
          </Row>
          <br />
        </CardBody>
      </Card>)

  }

};

export default UserPermissions;
