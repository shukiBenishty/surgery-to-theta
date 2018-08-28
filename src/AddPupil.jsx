// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Button, Row, Col, Container, Form, FormGroup,
  Card, CardBody, CardTitle,
  Input, InputGroup, InputGroupAddon,
  Alert
} from 'reactstrap';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { css } from 'glamor';
import moment from 'moment';
import _ from 'moment/locale/he';
import classNames from 'classnames';
import firebase from './firebase.js';
import PupilData from './model/PupilData';
import DropdownList from 'react-widgets/lib/DropdownList';
import database from './firebase-database.js'

type Pupil = {
    id: String,
    unitId: String,
    unitName: String,
    authority: String,
    groupId: String,
    groupName: String,
    pupilId: String,
    name: String,
    lastName: String,
    birthDay: Date,
    medicalLimitations:Boolean,
    address: String,
    parentId: String,
    parentName: String,
    phoneNumber: String,
    parentId2: String,
    parentName2: String,
    phoneNumber2: String,
    paymentApprovalNumber: String,
    paymentType: String,
    waitingList: Boolean
}

const InputField = ({id, defaultValue, label, onChange,
                    invalid, invalidMessage, className, disabled})  => {
  return (
    <React.Fragment>
        <Input id={id} name={label} disabled={disabled}
               defaultValue={defaultValue} onChange={onChange}></Input>
        <label className={className}>{invalidMessage}</label>
    </React.Fragment>
  )
}

const DatePicker = ({label, defaultValue, onChange,
                    invalid, invalidMessage, className}) => {
    return(
      <React.Fragment>
          <Datetime id="datetime_test"
                    defaultValue={defaultValue}
                    closeOnSelect={true}
                    onChange={onChange}
                    timeFormat={false}
                    local='he' />
           <label className={className}>{invalidMessage}</label>
      </React.Fragment>
    )
}

const AutoComplete = ({lable, data, value, onChange ,busy, groupBy, textField,
                      disabled, invalid, invalidMessage, className}) => {

  let filterGroupName = (item, value) => {
    const groupSymbol = item[textField].substr(0, item[textField].length);
    return groupSymbol.indexOf(value) === 0;
  }

  let Item = ({ item }) => (
    <span>
      <strong>{item.name}</strong>
    </span>
  );
  return <React.Fragment>
      <DropdownList
            disabled={disabled}
            groupBy={groupBy}
            textField={textField}
            busy={busy}
            groupBy={groupBy}
            filter={filterGroupName}
            data={data}
            value={value}
            onChange={onChange}
            isRtl={true}
            messages={ {
                  emptyFilter: 'לא נמצאו תוצאות סינון'
                }
            }/>
        <label className={className}>{invalidMessage}</label>
    </React.Fragment>
}

type State = {
  units: Unit[],
  groups: Group[],
  authorities: String[],
  pupil: Pupil
}

const mapStateToProps = (state) => {
  return {
    groups: state.groups,
    units: state.units,
    authorities: state.authorities,
    isAdmin: state.isAdmin
  }
}

@connect(mapStateToProps)
export default
class AddPupil extends React.Component<{}, State> {

  state = {
    invalidField: '',
    status: '',
    pupil: {
      metadata: {
        unitId: 0,
        groupId: 0
      }
    },
    disabledAuthority: false,
    disabledUnit: false,
    disabledGroup: false,
    formInalid: false,
    paymentTypeCash: false
  }

  async loadAuthorities() {
      this.setState({
        authorities: this.props.authorities,
        authoritiesLoaded: true
      })


  }

  async loadGroups() {

    try {
      const self = this;

      // const _units = [];

      // const units = this.props.units;
      //
      // units.forEach( (unit) => {
      //   const unitData = unit;
      //   _units.push({
      //     unitId: unit.unitId,
      //     unitName: unitData.unitName,
      //     authority: unitData.authority
      //   });
      // })
      const _units = this.props.units;

      const _groups = this.props.groups;

      self.setState({
        units: _units,
        unitsLoaded: true,
        groups: _groups,
        groupsLoaded: true
      },()=>{
        if(self.state.selectedAuthority !== 'אנא בחר רשות'){
          let authority = {};
          authority.name = self.state.selectedAuthority;
          self.authorityChanged(authority);
        }
        if(self.state.selectedUnit !== 'אנא בחר מוסד'){
          self.unitChanged(self.state.selectedUnit);
        }
        if(self.state.selectedGroup !== 'אנא בחר כיתה'){
          self.groupChanged(self.state.selectedGroup);
        }
      })
    } catch( err ) {
      return new Error(err);
    }

  }

  async componentDidMount() {

      console.log(this.props);

      let unit;
      let group;
      let pupil;


      const unitId = this.props.match.params.unitid;
      const groupId = this.props.match.params.groupid;
      const pupilId = this.props.match.params.pupilid;

      if( pupilId != 0 ) {
        this.setState({componnentHeader: "עריכת פרטי תלמיד"})
      } else {
        this.setState({componnentHeader: "הוספת תלמיד"})
      }

      if( unitId != 0 && groupId  != 0 ) {
          unit = await database.getUnitById(unitId);
          // unit.unitName = unit.name_he;

          group = await database.getGroupById(groupId);
        };

      if( pupilId != 0 ) {
         pupil = await database.getPupilById(pupilId);
         //pupil.birthDay = moment.unix(pupilData.birthDay.seconds).format('DD/MM/YYYY');

        let componnentHeader = "עריכת פרטי תלמיד: " + pupil.name + " " + pupil.lastName;

        this.setState({
          pupil: pupil,
          componentState: 'edit',
          disabledPupilId: true,
          componnentHeader: componnentHeader,
          disabledAuthority: true,
          disabledUnit: false,
          disabledGroup: false,
          selectedAuthority: unit.authority,
          selectedUnit: unit,
          formInalid: false,
          originalUnit: unit,
          selectedGroup: group
        })
      }
      else{

          this.setState({
            componentState: 'new',
            disabledPupilId: false,
            pupil : {},
            selectedAuthority: (unit) ? unit.authority : 'אנא בחר רשות' ,
            selectedUnit: (unit) ? unit : 'אנא בחר מוסד' ,
            selectedGroup: (group) ? group :'אנא בחר כיתה' ,
            disabledAuthority: false,
            disabledUnit: true,
            disabledGroup: true,
            formInalid: false,
            paymentTypeCash: true
          })
      }
      this.loadAuthorities();
      this.loadGroups();

  }

  birthDayChanged(_date: Date) {

    if( moment(_date).isValid() ) {
      this.state.pupil.birthDay = moment(_date);
      this.setState({
        pupil: this.state.pupil
      });
    }
  }


  onFormSubmit = async(event) => {
    event.preventDefault(); // stop from further submit

    let pupil = {
      pupilId: (event.target.pupilId.value) ? event.target.pupilId.value: undefined,
      name:(event.target.name.value) ? event.target.name.value: undefined,
      lastName: (event.target.lastName.value) ? event.target.lastName.value: undefined ,
      birthDay: (this.state.pupil.birthDay) ? this.state.pupil.birthDay: undefined ,
      medicalLimitations: (event.target.medicalLimitations.checked) ? true : false,
      address: (event.target.address.value) ? event.target.address.value: undefined ,
      parentId: (event.target.parentId.value) ? event.target.parentId.value: undefined ,
      parentName: (event.target.parentName.value) ? event.target.parentName.value: undefined  ,
      phoneNumber: (event.target.phoneNumber.value) ? event.target.phoneNumber.value: undefined ,
      parentId2: (event.target.parentId2.value) ? event.target.parentId2.value: undefined ,
      parentName2: (event.target.parentName2.value) ? event.target.parentName2.value: undefined ,
      phoneNumber2: (event.target.phoneNumber2.value) ? event.target.phoneNumber2.value: undefined ,
      paymentApprovalNumber: (event.target.paymentApprovalNumber.value) ? event.target.paymentApprovalNumber.value: undefined ,
      receiveNumber: (event.target.paymentTypeCash.checked) ? event.target.receiveNumber.value : undefined ,
      waitingList: (event.target.waitingList.checked)? true : false,
    }

    Object.keys(pupil).forEach(key => {
      if(pupil[key] === null || pupil[key] === undefined){
        delete pupil[key];
      }
     })

    let _state = {};
    if (pupil) {
       _state.pupil = pupil;
    }

    //validation
    if( !(_state.pupil &&
        (this.state.selectedAuthority !== 'אנא בחר רשות' )&&
        (this.state.selectedUnit !==  'אנא בחר מוסד')&&
        (this.state.selectedGroup !== 'אנא בחר כיתה')&&
        (_state.pupil.pupilId)&&
        (_state.pupil.name)&&
        (_state.pupil.lastName)&&
        (_state.pupil.birthDay)&&
        (_state.pupil.parentId)&&
        (_state.pupil.phoneNumber)&&
        (!event.target.paymentTypeCash.checked || !!event.target.receiveNumber.value))) {
          _state.formInalid = true;
          this.setState(_state)
          return;
        }

        pupil.birthDay = moment(pupil.birthDay).toDate();

      try {
        _state.formInalid = false;
        _state.status = 'נתוני ,תלמיד מתעדכנים למערכת. נא להמתין...';
        this.setState(_state)

        const toastId = toast.success('פרטי התלמיד מתעדכנים במערכת', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            //draggable: false
        });

            const unitId = this.state.selectedUnit.metadata.unitId;
            const groupId = this.state.selectedGroup.metadata.groupId;

            if(this.props.match.params.pupilid != 0) {

                database.updatePupil(this.props.match.params.unitid,
                                      this.props.match.params.groupid,
                                      groupId,
                                      this.props.match.params.pupilid,
                                      pupil);
            } else {
                // Add new pupil to Firestore
                database.addPupil(unitId, groupId, pupil);
            }


            toast.update(this.toastId,
                  {
                    render: 'פרטי התלמיד עודכנו במערכת',
                    type: toast.TYPE.SUCCESS,
                    autoClose: 3000,
                    className: css({
                      transform: "rotateY(360deg)",
                      transition: "transform 0.6sec"
                    })
                  });

                setTimeout( () => {
                    if (this.props.match.params.groupid != 0) {
                      this.props.history.push(`/dashboard/pupils`);
                    } else {
                      this.props.history.push(`/dashboard/pupils`);
                    }
                  }, 1500);


            } catch( err ) {
              console.error(err);
              toast.update(this.toastId,
                            {
                              render: 'פעולה נכשלה עקב בעיית התקשורת.',
                              type: toast.TYPE.ERROR,
                              autoClose: 5000,
                            }
                          );
            }

  }

  authorityChanged = (authority) => {


    const _units = this.state.units.filter( unit => {
        return authority.name === unit.authority
    });

    const _groups = this.state.groups.filter( group => {
      return _units.find( unit => {
        return unit.metadata.unitId === group.metadata.unitId
      })
    });

    // this.state.pupil.authority = authority.name;
      // disabledUnit: false,
    this.setState({

      filterdUnits: _units,
      filterdGroups: _groups,
      selectedAuthority: authority,
      selectedUnit: 'אנא בחר מוסד',
      selectedGroup: 'אנא בחר כיתה',
      pupil: this.state.pupil
    });
  }

  unitChanged = (unit) => {

    const _groups = this.state.groups.filter( group => {
        //console.log(group);
        if( unit.metadata.unitId && group.metadata.unitId ) {
          return unit.metadata.unitId === group.metadata.unitId
        } else {
          return false;
        }
      });

    //this.state.pupil.metadata.unitId = unit.metadata.unitId;
    // this.state.pupil.unitName = unit.unitName;
    this.setState({
      disabledGroup: (this.state.componentState === 'edit') ? false : true,
      filterdGroups: _groups,
      selectedUnit: unit,
      selectedGroup: 'אנא בחר כיתה',
      pupil: this.state.pupil
    });
  }

  groupChanged = (group) => {
    this.state.pupil.metadata.groupId = group.metadata.groupId;
    this.state.pupil.groupName = group.groupName;
    this.setState({
      selectedGroup: group,
      pupil: this.state.pupil
    });
  }

  paymentTypeChanged = (e) => {
    this.setState({
      paymentTypeCash: !this.state.paymentTypeCash
    })
  }

  render() {

    let inalid = this.state.formInalid;
    const validationErrorClassNames = classNames({
      'text-left my-auto' : true,
      'text-danger': inalid,
      'visible': inalid,
      'invisible': !inalid
    })


    return (<div>
      <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl
          pauseOnVisibilityChange={false}
          draggable={false}
          pauseOnHover={false}
          />
      <div className='panel-header panel-header-sm'></div>
      <div className='content container h-100'>
        <Row>
          <Col className='col-md-12'>
            <Card body className="text-center">
              <div className='card-header'>
                <h5 className='title'>{this.state.componnentHeader}</h5>
              </div>
              <CardBody>
                <Card>
{this.state.pupil && <CardBody>
                      <Form onSubmit={::this.onFormSubmit}>
                        <Container>
                          <Card>
                            <CardTitle className="text-left my-auto m-3">
                              <div>פרטי ילד</div>
                            </CardTitle>
                            <CardBody>
                              <Row>
                                <Col md='4' className='pr-1 text-left'>
                                  <div>
                                    <label className='form-control-label'>רשות</label>
                                    <AutoComplete onChange={::this.authorityChanged}
                                      lable="רשות" data={this.state.authorities} groupBy="region"
                                      value={this.state.selectedAuthority}
                                      busy={!this.state.authoritiesLoaded}
                                      textField="name"
                                      invalidMessage="שדה חובה"
                                      className={validationErrorClassNames}
                                      disabled={this.state.disabledAuthority}/>
                                  </div>
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>מוסד</label>
                                  <AutoComplete onChange={::this.unitChanged}
                                    lable="מוסד" data={this.state.filterdUnits} groupBy="unitName"
                                    value={this.state.selectedUnit}
                                    busy={!this.state.unitsLoaded}
                                    textField="unitName"
                                    invalidMessage="שדה חובה"
                                    className={validationErrorClassNames}
                                    disabled={this.state.disabledUnit}/>
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>כיתה</label>
                                   <AutoComplete onChange={::this.groupChanged}
                                     lable="כיתה" data={this.state.filterdGroups} groupBy="groupName"
                                     value={this.state.selectedGroup}
                                     busy={!this.state.groupsLoaded}
                                     textField="groupName"
                                     invalidMessage="שדה חובה"
                                     className={validationErrorClassNames}
                                     disabled={this.state.disabledGroup}/>
                                </Col>
                              </Row>
                              <br />
                              <Row>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>ת.ז.</label>
                                  <InputField id="pupilId" label="ת.ז."
                                    defaultValue={this.state.pupil.pupilId}
                                    invalidMessage="שדה חובה"
                                    className={validationErrorClassNames} />
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>שם פרטי</label>
                                  <InputField id="name" label="שם פרטי"
                                      defaultValue={this.state.pupil.name}
                                      invalidMessage="שדה חובה"
                                      className={validationErrorClassNames} />
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                   <label className='form-control-label'>שם משפחה</label>
                                   <InputField id="lastName" label="שם משפחה"
                                       defaultValue={this.state.pupil.lastName}
                                       invalidMessage="שדה חובה"
                                       className={validationErrorClassNames}/>
                                </Col>
                              </Row>
                              <br />
                              <Row>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>תאריך לידה</label>
                                  <DatePicker label="תאריך לידה"
                                      defaultValue={this.state.pupil.birthDay}
                                      onChange={::this.birthDayChanged}
                                      invalidMessage="שדה חובה"
                                      className={validationErrorClassNames}/>

                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>כתובת</label>
                                  <InputField id="address"
                                      defaultValue={this.state.pupil.address}
                                      label="כתובת"
                                      className={validationErrorClassNames}/>
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>מגבלות רפואיות</label>
                                  <div className='form-check'
                                    style={{
                                      marginTop: '-16px'
                                    }}>
                                    <label className='form-check-label'>
                                      <Input className='form-check-input'
                                        id="medicalLimitations"
                                        type='checkbox'
                                        className='checkbox'
                                        defaultChecked={this.state.pupil.medicalLimitations}
                                      />
                                      <span className='form-check-sign'></span>
                                    </label>
                                  </div>
                                </Col>
                              </Row>
                            </CardBody>
                          </Card>
                          <Card>
                            <CardTitle className="text-left my-auto m-3">
                                <div>פרטי הורים</div>
                            </CardTitle>
                            <CardBody>
                              <Row>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>ת.ז. הורה</label>
                                  <InputField id="parentId" label="ת.ז. הורה"
                                      defaultValue={this.state.pupil.parentId}
                                      invalidMessage="שדה חובה"
                                      className={validationErrorClassNames}/>
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>שם הורה</label>
                                  <InputField id="parentName"
                                      defaultValue={this.state.pupil.parentName}
                                      label="שם הורה"
                                      className={validationErrorClassNames}/>
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>טלפון הורה</label>
                                  <InputField id="phoneNumber" label="טלפון הורה"
                                      defaultValue={this.state.pupil.phoneNumber}
                                      invalidMessage="שדה חובה"
                                      className={validationErrorClassNames}/>
                               </Col>
                              </Row>
                              <br />
                              <Row>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>ת.ז. הורה נוסף</label>
                                  <InputField id="parentId2" label="ת.ז. הורה נוסף"
                                      defaultValue={this.state.pupil.parentId2}
                                      className={validationErrorClassNames}/>
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>שם הורה נוסף</label>
                                  <InputField id="parentName2" label="שם הורה נוסף"
                                      defaultValue={this.state.pupil.parentName2}
                                      className={validationErrorClassNames}/>
                                </Col>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>טלפון נוסף</label>
                                  <InputField id="phoneNumber2" label="טלפון נוסף"
                                      defaultValue={this.state.pupil.phoneNumber2}
                                      className={validationErrorClassNames}/>
                                </Col>

                              </Row>
                            </CardBody>
                          </Card>
                          <Card>
                            <CardTitle className="text-left my-auto m-3">
                              <div>תשלום</div>
                            </CardTitle>
                            <CardBody>
                              <Row>
                                <Col md='4' className='pr-1 text-left'>
                                  <label className='form-control-label'>אישור תשלום טלפוני</label>
                                  <InputField id="paymentApprovalNumber"
                                    label="אישור תשלום טלפוני"
                                    defaultValue={this.state.pupil.paymentApprovalNumber}
                                    className={validationErrorClassNames}
                                    disabled={true}/>
                                </Col>
                              </Row>
                              <br/>
                              <Row>
                                <Col md='2' className="pr-1 text-left">
                                  <label className='info-text'>תשלום במשרד</label>
                                  <div className='form-check'>
                                    <label className='form-check-label'
                                      style={{
                                        paddingLeft: '0px',
                                        paddingBottom: '30px'
                                      }}>
                                      <Input className='form-check-input checkbox'
                                        id="paymentTypeCash"
                                        type="checkbox"
                                        className='checkbox'
                                        onChange={::this.paymentTypeChanged}
                                        checked={this.state.paymentTypeCash}/>
                                      <span className='form-check-sign'></span>
                                    </label>
                                  </div>
                                </Col>
                                <Col md='2' className="pr-1 text-left">
                                  <label className='info-text'>מספר קבלה</label>
                                  <InputField id="receiveNumber"
                                    label="מס' קבלה"
                                    placeholder="מס' קבלה"
                                    defaultValue={this.state.pupil.receiveNumber}
                                    className={validationErrorClassNames}
                                    disabled={!this.state.paymentTypeCash}/>
                                </Col>
                              </Row>
                              <Row>
                                <Col md='2' className="pr-1 text-left">
                                    <label className='info-text'>רשימת המתנה</label>
                                    <div className='form-check'>
                                      <label className='form-check-label'
                                        style={{
                                          paddingLeft: '0px',
                                          paddingBottom: '30px'
                                        }}>
                                        <Input className='form-check-input checkbox'
                                          id="waitingList"
                                          type="checkbox"
                                          className='checkbox'/>
                                          <span className='form-check-sign'></span>
                                        </label>
                                    </div>
                                </Col>

                              </Row>
                            </CardBody>
                          </Card>
                          <Row>
                            <Col md={{ size:1, offset: 10}}>
                              <Button type="submit" color='primary'>שמור</Button>
                            </Col>
                          </Row>

                        <br />
                        <br />
                        <br />
                        </Container>
                      </Form>
                    </CardBody>}
                </Card>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </div>)
  }

};
