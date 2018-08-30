// @flow
import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import ReactTable from 'react-table';
import Multiselect from 'react-widgets/lib/Multiselect'
import Datetime from 'react-datetime';
import moment from 'moment';
import XLSX from 'xlsx';
import firebase from './firebase.js';
import Pagination from './TablePagination';
import { Container, Button,
  Row, Col, Card, CardHeader, CardBody,
  Tooltip,
  Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';

import database from './firebase-database.js'


type Pupil = {
    id: String,
    groupId: String,
    unitId: String,
    pupilId: String,
    unitName: String,
    authority: String,
    groupName: String,
    name: String,
    lastName: String,
    birthDay: Date,
    phoneNumber: String,
    medicalLimitations:Boolean
}

type State = {
  pupils: Pupil[],
  authorities: String[],
  authoritiesLoaded: Boolean,
  selectedAuthorities: String[],
  loading: Boolean,
  displayedPupils: Pupil[],
  tooltipOpen: Boolean,
  modal: Boolean,
  unitId: String,
  groupId: String,
  pupilId2Delete: String
}

const mapStateToProps = (state) => {
  return {
    units: state.units,
    groups: state.groups,
    authorities: state.authorities,
    pupils: state.pupils,
    isAdmin: state.isAdmin,
  }
}

@withRouter
@connect(mapStateToProps)
export default
class Pupils extends React.Component<{}, State> {

  state = {
    pupils: [],
    authorities: [],
    unitsLoaded: false,
    authoritiesLoaded: false,
    loading: true,
    selectedAuthorities: [],
    selectedUnits: [],
    displayedPupils: [],
    tooltipOpen: false,
    modal: false,
    unitId: '',
    groupId: '',
    pupilId2Delete: ''
  }

  constructor(props) {

    super(props);

    this.styles = {
      isClosed: {
        marginTop: '-16px'
      }
    }
  }

 loadAuthorities( props ) {
      this.setState({
        authorities: props.authorities,
        authoritiesLoaded: true
      })
  }

 loadPupils(isAdmin: Boolean, props) {

    let _pupils = props.pupils.map((pupil) => {

      let _group = database.getGroupById(pupil.metadata.groupId);
      let groupSymbol = (_group) ?_group.symbol : ''
        return{
          ...pupil,
          groupSymbol:groupSymbol  ,
          isAdmin: isAdmin
        };
    });

    this.setState({
        units: this.props.units,
        selectedUnits: this.props.units,
        _units: props.units,
        pupils: _pupils,
        displayedPupils:_pupils ,
        loading: false
    });
}

  componentDidMount(){

    this.loadPupils(this.props.isAdmin, this.props);
    this.loadAuthorities(this.props);
    this.setState({
      units: this.props.units,
      groups: this.props.groups,
      unitsLoaded: true
    })
  }

  shouldComponentUpdate(nextProps, nextState) {

    if(nextProps.pupils !== this.props.pupils||
      nextProps.isAdmin !== this.props.isAdmin){
      this.loadPupils(nextProps.isAdmin, nextProps);
    }
    if (nextProps.authorities !== this.props.authorities) {
      this.loadAuthorities(nextProps);
    }
    if (nextProps.units !== this.props.units) {
      this.setState({
        units: nextProps.units,
        unitsLoaded: true
      })
    }
    if (nextProps.groups !== this.props.groups) {
      this.setState({
        groups: nextProps.groups
      })
    }
    if(nextState !== this.state){
      return true;
    } else {
      return false;
    }

  }

  renderCheckable(cellInfo) {

    const pupilData = this.state.pupils[cellInfo.index];
    const _medicalLimitations = pupilData.medicalLimitations;

    return (
      <div className='form-check'
        style={{
          marginTop: '-16px'
        }}>
        <label className='form-check-label'>
          <input className='form-check-input'
            type='checkbox'
            className='checkbox'
            checked={_medicalLimitations}
          />
          <span className='form-check-sign'></span>
       </label>
     </div>)
  }

  toggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
  }

  editPupil(unitId: String,
            groupId: String,
            pupilId: String) {
    this.props.history.push(`/dashboard/addpupil/${unitId}/${groupId}/${pupilId}`);
  }

 deletePupil() {

    if( this.state.unitId !== ''
      && this.state.groupId !== ''
      && this.state.pupilId2Delete !== '' ) {

     database.deletePupilById(this.state.unitId,
                              this.state.groupId,
                              this.state.pupilId2Delete);

    // await fetch('https://rishumon.com/api/elamayn/edit_class.php?secret=Day1%21', {
    //   // headers: {
    //   //     "Content-Type": "application/json",
    //   // },
    //   mode: 'no-cors', // no-cors prevents reading the response
    //   method: 'POST',
    //   body: JSON.stringify(data2post)
    // });

      this.setState({
        modal: !this.state.modal,
        unitId: '',
        groupId: '',
        pupilId2Delete: ''
      });

   }
  }

  toggleModal(unitId: String,
              groupId: String,
              pupilRecordId: String) {

      this.setState({
        modal: !this.state.modal,
        unitId: unitId,
        groupId: groupId,
        pupilId2Delete: pupilRecordId
      });
  }

  columns =[
    {
       Header:'ת.ז.',
       accessor:'pupilId',
       style:{
          lineHeight:'3em'
       }
    },
    {
       Header:'שם פרטי',
       accessor:'name',
       style:{
          lineHeight:'3em'
       }
    },
    {
       Header:'שם משפחה',
       accessor:'lastName',
       style:{
          lineHeight:'3em'
       }
    },
    {
       Header:'תאריך לידה',
       accessor:'birthDay',
       style:{
          lineHeight:'3em'
       }
    },
    {
       Header:'טלפון',
       accessor:'phoneNumber',
       style:{
          lineHeight:'3em'
       }
    },
    {
       Header:'מזהה כיתה',
       accessor:'groupSymbol',
       style:{
          lineHeight:'3em'
       }
    },
    {
       Header: 'מגבלות רפואיות',
       accessor:'medicalLimitations',
       Cell: ::this.renderCheckable,
       style: {
         lineHeight: '3em'
       }
    }, {
      Header: '',
      accessor: 'editors',
      width: 80,
      Cell: row => {

        const unitId = row.original.metadata.unitId;
        const groupId = row.original.metadata.groupId;
        const pupilRecordId = row.original.metadata.pupilId;

        return <Row>
          <Col md='4'>
            <Button disabled={!row.original.isAdmin}
                    className='btn-round btn-icon btn btn-info btn-sm'
                    id='btnEditPupil'
                    style={{
                      'padding': '0'
                    }}
                    onClick={ () => ::this.editPupil(unitId, groupId, pupilRecordId) } >
                    <i className='fa fa-edit'></i>
            </Button>
          </Col>
          <Col md='4'>
              <Button disabled={!row.original.isAdmin}
                      className='btn-round btn-icon btn btn-danger btn-sm'
                      style={{
                        'padding': '0'
                      }}
                      onClick={ () => ::this.toggleModal(unitId, groupId, pupilRecordId) } >
                    <i className='fa fa-times'></i>
              </Button>
          </Col>
        </Row>
      }
    }];

  exportExcel() {

    const header = [''];
    this.columns.forEach( col => {header.push(col.Header);});
    const _export = {data: [ header ] };

    this.reactTable.state.sortedData.forEach( (pupil, index) => {
      const pupilData = [];
      pupilData.push(1 + index); // reserve 1 for caption row
      this.columns.forEach(col =>{
          pupilData.push(pupil[col.accessor]);
      })

      _export.data.push(pupilData);
    })

    /* create a new blank workbook */
    var workbook = XLSX.utils.book_new();
    console.log(workbook.Views);
    /* convert from array of arrays to workbook */
    var worksheet = XLSX.utils.aoa_to_sheet(_export.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'תלמידים');

    /* create view to RTL */
    if(!workbook.Workbook) workbook.Workbook = {};
    if(!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if(!workbook.Workbook.Views[0]) workbook.Workbook.Views[0] = {};
    workbook.Workbook.Views[0].RTL = true;

    /* write a workbook */
    XLSX.writeFile(workbook, 'pupils.xlsx');

  }

  async updateFirestore(pupilIndex: Number,
                        pupilId: String,
                        groupId: String,
                        unitId: String,
                        fieldName: String,
                        value) {

     const data = [...this.state.pupils];
     data[pupilIndex][fieldName] = value;
     this.setState({
        pupils: data
     });

     try {
        let json = {};
        const updateField = fieldName;
        json[updateField] = value;

        database.updatePupil(unitId, groupId, pupilId, json);

     } catch( err ) {
       console.error(err);
     }

  }


  onUnitChanged = (units) => {

    const _units = ( units.length !== 0 ) ? units : this.state.units;

    this.setState({
      selectedUnits: _units
    });
    this.filerPupils(this.state._units, _units)
   }


  onAuthorityChanged = (authorities) => {

    const _units = ( authorities.length !== 0 ) ?
                    ( this.state.units.filter( unit => {
                        return authorities.find( authority => {
                          return authority.name === unit.authority}
                        )
                      })) : this.state.units;

    this.setState({
      selectedAuthorities: authorities,
      _units: _units
    });
    this.filerPupils(_units, this.state.selectedUnits);
  }


  filerPupils(unitsFromAuthorities , unitsFromUnits){
    if (this.state.selectedAuthorities.length === 0 && this.state.selectedUnits.length === 0) {
          this.setState({
            displayedPupils : this.state.pupils
        });
    } else {
        const incision = unitsFromAuthorities.filter( a_unit => {
          return unitsFromUnits.find( u_unit => {
            return a_unit.metadata.unitId === u_unit.metadata.unitId}
          )
        });

        const _pupils = this.state.pupils.filter( pupil => {
          return incision.find( unit => {
            return unit.metadata.unitId === pupil.metadata.unitId}
          )
        });

        this.setState({
          displayedPupils : _pupils
      });
    }
  }

  render() {


    const self = this;

    return <div>
              <div className='panel-header panel-header-sm'></div>
              <Container className='content h-100'>
                <Row>
                  <Col md='12'>
                    <Card>
                      <CardHeader>
                        <h5 className='title'>רשימת תלמידים</h5>
                      </CardHeader>
                      <CardBody>
                        <Row className='align-items-center'>
                          <Col md='3'>
                            <Multiselect
                              busy={!this.state.authoritiesLoaded}
                              groupBy='region'
                              textField='name'
                              isRtl={true}
                              placeholder='סנן לפי רשויות'
                              data={this.state.authorities}
                              onChange={ value => ::this.onAuthorityChanged(value) }
                            />
                          </Col>
                          <Col md='3'>
                            <Multiselect
                              busy={!this.state.unitsLoaded}
                              groupBy='authority'
                              textField='unitName'
                              isRtl={true}
                              placeholder='סנן לפי מוסדות'
                              data={this.state._units}
                              onChange={ value => ::this.onUnitChanged(value) }
                            />
                          </Col>
                          <Col md={{ size: 2, offset: 10 }}
                              className='text-right my-auto' id='tooltipContainer'>
                              <Button color='primary' id='btnExportExcel'
                                      onClick={::this.exportExcel}>
                                      Excel&nbsp;<i className="far fa-file-excel"></i>
                              </Button>

                              <Tooltip placement='auto'
                                autohide={false}
                                isOpen={this.state.tooltipOpen}
                                toggle={::this.toggle}
                                container='tooltipContainer'
                                style={{
                                  backgroundColor: 'black',
                                  color: 'white'
                                }}
                                target='btnExportExcel'>
                                  ייצוא לקובץ חיצוני
                              </Tooltip>
                          </Col>
                        </Row>
                        <Row>
                          <Col md='12'>
                            <Modal isOpen={this.state.modal}>
                              <ModalHeader>
                                מחיקת הנרשם
                              </ModalHeader>
                              <ModalBody>
                                אישור לפעולה זו תגרום לחיקה מוחלטת של כל נתוני הנרשם. זאת פעולה לא הפיכה.
                              </ModalBody>
                              <ModalFooter>
                                <Button color="primary" onClick={::this.deletePupil}>אישור</Button>{' '}
                                <Button color="secondary" onClick={() => ::this.toggleModal('', '', '')}>ביטול</Button>
                              </ModalFooter>
                            </Modal>
                            <ReactTable
                              ref={ (t) => this.reactTable = t }
                              filterable
                              PaginationComponent={Pagination}
                              getTheadThProps = { () => {
                                return {
                                  style: {
                                    'textAlign': 'right',
                                    'fontWeight': '700'
                                  }
                                }
                              }}
                              loading={this.state.loading}
                              loadingText='טוען נתונים...'
                              noDataText='אין נתונים להצגה'
                              previousText = 'קודם'
                              nextText = 'הבא'
                              pageText = 'עמוד'
                              ofText = 'מתוך'
                              rowsText = 'שורות'
                              data={this.state.displayedPupils}
                              columns={this.columns}/>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </Container>
         </div>
  }

}
