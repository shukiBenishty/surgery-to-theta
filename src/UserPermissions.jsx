// @flow
import React from 'react';
import { connect } from 'react-redux';
import firebase from './firebase.js';
import { Card, CardHeader, CardBody,
  Row, Col,
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
  role: String

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
    unitsListOpen: false,
    units: [],
    groupRoles: [],
    selectedGroup: '',
    selectedUnit: '',
    allowGroupDelete: false,
    groupDeleteTooltipOpen: false,
    allowUnitDelete: false,
    saveChangingTooltipOpen: false,
    unitsDisabled: false,
    role: undefined
  }

  componentDidMount() {

      this.setState({
        users: this.props.users,
        userId: this.props.userId,
        user: deepCopy(database.getUserById(this.props.userId)),
        units: this.props.units
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
          ///for test
    if(this.state.unitsListOpen){
      database.changePermissions(this.state.user).then((res) => {
        console.log(res)
      }).catch((err) => {
        console.log(err)
      })
    }
    ///////
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
          <label >כתיבה</label>
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


    let filterGroupName = (item, value) => {
      const groupSymbol = item.substr(6, item.length);
      return groupSymbol.indexOf(value) === 0;
    }

    let filterUnitName = (item, value) => {
      return item.symbol.indexOf(value) === 0 || item.unitName.indexOf(value) === 0;
    }

    const saveChanging = classNames({
      'd-none': !this.state.allowUnitDelete,
      'fa': true,
      'fa-trash': true
    });


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
                  placeholder='סנן לפי רשויות'
                  value={this.state.role}
                  data={[{label:"משתמש" , role: "user"},{label:"מנהל", role:"admin"}]}
                  textField="label"
                  onChange={::this.roleChange}
                  />
            </Col>
            <Col md='1' id='RoleTooltipContainer' style={{
                lineHeight: '2.5em',
                paddingRight: '0',
                textAlign: 'start'
              }}>
                <i className={saveChanging} id='saveRoleChangingElement'
                  onClick={::this.saveRoleChanging}></i>
                <Tooltip placement='top'
                  autohide={false}
                  isOpen={this.state.unitsDisabled}
                  toggle={::this.toogleSaveChangingTooltip}
                  container='RoleTooltipContainer'
                  style={{
                    backgroundColor: 'black',
                    color: 'white'
                  }}
                  target='saveRoleChangingElement'>
                  לחץ לשמירת השינויים
                </Tooltip>
            </Col>
            <Col md='7'>
              <DropdownList onFocus={::this.openCloseUnitsList} onBlur={::this.openCloseUnitsList}
                  filter={filterUnitName}
                  itemComponent={this.ListUnits}
                  valueComponent={this.ListUnits}
                  value={{"symbol": "סמל מוסד", "unitName": "שם מוסד"}}
                  open={this.state.unitsListOpen}
                  data={this.state.units}
                  groupBy="authority"
                  disabled={this.state.unitsDisabled}
                  messages={{
                    emptyFilter: 'לא נמצאו תוצאות סינון'
                  }}
                  />
            </Col>
            <Col md='1' id='unitTooltipContainer' style={{
                lineHeight: '2.5em',
                paddingRight: '0',
                textAlign: 'start'
              }}>
                <i className={saveChanging} id='saveChangingElement'
                  onClick={::this.saveChanging}></i>
                <Tooltip placement='top'
                  autohide={false}
                  isOpen={this.state.saveChangingTooltipOpen}
                  toggle={::this.toogleSaveChangingTooltip}
                  container='unitTooltipContainer'
                  style={{
                    backgroundColor: 'black',
                    color: 'white'
                  }}
                  target='saveChangingElement'>
                  לחץ לשמירת השינויים
                </Tooltip>
            </Col>
          </Row>
          <br />
        </CardBody>
      </Card>)

  }

};

export default UserPermissions;
