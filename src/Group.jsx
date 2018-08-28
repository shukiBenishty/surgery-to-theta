// flow
import React from 'react';
import { connect } from 'react-redux';
import { Button, Row, Col, Input,
         Card, CardBody, Tooltip,
         Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import ReactTable from 'react-table';
import Datetime from 'react-datetime';
import moment from 'moment';
import XLSX from 'xlsx';
import firebase from './firebase.js';

import GroupData from './model/GroupData';
import PupilData from './model/PupilData';
import database from './firebase-database.js'

type State = {
  pupils: Array<PupilData>,
  groupData: GroupData,
  dataStatus: String,
  tooltipOpen: Boolean,
  modal: Boolean,
  pupilId2Delete: String
}

const mapStateToProps = (state) => {
  return {
    groups: state.groups,
    isAdmin: state.isAdmin,
    pupilsLoaded: state.pupilsLoaded
  }
}

@connect(mapStateToProps)
class Group extends React.Component<{}, State> {

  state = {
    pupils: [],
    groupData: {
      name: '',
      symbol: '',
      openFrom: '____/__/__',
      openTill: '____/__/__'
    },
    dataStatus: 'טעינת נתונים..',
    tooltipOpen: false,
    modal: false,
    pupilId2Delete: ''
  }

  componentDidUpdate(prevProps, prevState, snapshot) {

    if( prevProps.groups !== this.props.groups ||
      prevProps.pupilsLoaded !== this.props.pupilsLoaded ) {
      ::this.loadData(prevProps.isAdmin);
    }

    //console.log(prevState);
    //console.log(prevProps.groups );
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //
  //   // if( nextProps.isAdmin !== this.props.isAdmin ||
  //   //   nextProps.groups[this.props.match.params.groupid] !== this.props.groups[this.props.match.params.groupid]) {
  //   if( nextProps.isAdmin !== this.props.isAdmin
  //   || this.state.groupData) {
  //     ::this.loadData(nextProps.isAdmin);
  //   }
  //
  //   if( nextState !== this.state){
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  componentDidMount() {
      ::this.loadData(this.props.isAdmin);
  }

  loadData(isAdmin) {

    const groupId = this.props.match.params.groupid;
    const unitId = this.props.match.params.unitid;

    if( !this.props.pupilsLoaded ) {
      return;
    }

    try {

      let data = database.getGroupById(groupId);
      if (!data) {
        return;
      }
      const _groupData = new GroupData(data.name,
                                        data.symbol,
                                        data.capacity,
                                        data.price,
                                        data.openFrom,
                                        data.openTill,
                                        data.paymentInstallments);
      this.setState({
        groupData: _groupData
      })

      const _pupils = database.getAllPupilsInGroup(groupId);
      ::this.pupilsFromDocs(_pupils, isAdmin);

    } catch( err ) {
      console.error(err);
    }
  }

  componentWillUnmount() {
    if( this.observer )
      this.observer();
  }

  pupilsFromDocs(pupils, isAdmin: Boolean) {

    const _pupils = pupils.map( (pupil) => {
      return new PupilData(pupil.metadata.pupilId,
                              `${pupil.name} ${pupil.lastName}`,
                              pupil.lastName,
                              pupil.pupilId,
                              pupil.phoneNumber,
                              pupil.medicalLimitations,
                              pupil.birthDay,
                              pupil.whenRegistered,
                              pupil.parentId,
                              pupil.address,
                              isAdmin);
    })

    if( _pupils.length == 0 ) {
      this.setState({
          dataStatus: 'עדיין לא נרשם אף אחד',
          pupils: _pupils
      });
    } else {
      this.setState({
        pupils: _pupils
      });
    }
  }

  exportExcel() {

    const _export = {
      /* Array of Arrays e.g. [["a","b"],[1,2]] */
     data: [
       ["", "שם", "ת.ז.", "מספר טלפון", "תאריך לידה", "תאריך הרשמה", "מזהה הורה", "כתובת"],
     ],
    };

    this.state.pupils.forEach( (pupil, index) => {
      const pupilData = [];
      pupilData.push(1 + index); // reserve 1 for caption row
      pupilData.push(pupil.name);
      pupilData.push(pupil.id);
      pupilData.push(pupil.phoneNumber);
      pupilData.push(pupil.birthDay);
      pupilData.push(pupil.whenRegistered);
      pupilData.push(pupil.parentId);
      pupilData.push(pupil.address);

      _export.data.push(pupilData);
    })

    /* create a new blank workbook */
    var workbook = XLSX.utils.book_new();
    console.log(workbook.Views);
    /* convert from array of arrays to workbook */
    var worksheet = XLSX.utils.aoa_to_sheet(_export.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, this.state.groupData.name);

    /* create view to RTL */
    if(!workbook.Workbook) workbook.Workbook = {};
    if(!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if(!workbook.Workbook.Views[0]) workbook.Workbook.Views[0] = {};
    workbook.Workbook.Views[0].RTL = true;

    /* write a workbook */
    XLSX.writeFile(workbook, `${this.state.groupData.name}.xlsx`);
  }

  async updateFirestore(pupilIndex: Number,
                  fieldName: String,
                  value) {
    if( value != null ) {

      const groupId = this.props.match.params.groupid;
      const unitId = this.props.match.params.unitid;

      const data = [...this.state.pupils];
      data[pupilIndex][fieldName] = value;
      this.setState({
        pupils: data
      });

      const pupilRecordId = data[pupilIndex].recordId;

      try {
        let json = {};
        const updateField = fieldName;
        json[updateField] = value;

        database.updatePupil(unitId, groupId, pupilRecordId, json)

      } catch( err ) {
        console.error(err);
      }

    }
  }

  toggleIsMedicalLimitations(index: Number) {

    const pupilData = this.state.pupils[index];
    pupilData.medicalLimitations = !pupilData.medicalLimitations;
    this.setState({
      pupils: this.state.pupils
    });

    this.updateFirestore(index,
                        'medicalLimitations',
                        pupilData.medicalLimitations);
  }

  async handleUpdate(cellInfo, e) {
    if( e.key === 'Enter' || e.type === 'blur') {

      e.preventDefault();

      const value = e.target.innerHTML;
      this.updateFirestore(cellInfo.index,
                           cellInfo.column.id,
                           value);
    }
  }

  toggle() {
   this.setState({
     tooltipOpen: !this.state.tooltipOpen
   });
  }

  addPupil() {
    this.props.history.push(`/dashboard/addpupil/${this.props.match.params.unitid}/${this.props.match.params.groupid}/0`);
  }

  async deletePupil() {

    database.deletePupilById(this.props.match.params.unitid,
                              this.props.match.params.groupid,
                              this.state.pupilId2Delete);

    this.setState({
      modal: !this.state.modal,
      pupilId2Delete: ''
    });

  }

  toggleModal(pupilRecordId: String) {
    this.setState({
      modal: !this.state.modal,
      pupilId2Delete: pupilRecordId
    });
  }

  editPupil(pupilId: String) {
    this.props.history.push(`/dashboard/addpupil/${this.props.match.params.unitid}/${this.props.match.params.groupid}/${pupilId}`);
  }

  render() {
    return (
      <div>
        <div className='panel-header panel-header-sm'></div>
        <div className='content container h-100'>
          <Row>
            <Col className='col-md-12'>
              <Card>
                <div className='card-header'>
                  <h5 className='title' dir='rtl'>רישום תלמידים לכיתה {this.state.groupData.name} (מזהה {this.state.groupData.symbol}) </h5>
                  <h5 className='title'>קיבולת: {this.state.groupData.capacity} ילדים</h5>
                  <h5 className='title'>תאריכי פעילות: מ {this.state.groupData.openFrom} עד {this.state.groupData.openTill}</h5>
                </div>
                <CardBody>
                  <Row className='align-items-center'>
                    <Col md={{ size: 2, offset: 8 }}
                      className="text-right my-auto" id='tooltipContainer'>
                      <Button color='primary' id='btnExportExcel'
                              onClick={::this.exportExcel}>
                              <span>Excel</span>&nbsp;<i className="far fa-file-excel fa-lg"></i>
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
                    <Col md='2' className='text-right my-auto' >
                      <Button color='primary'
                              disabled={!this.props.isAdmin}
                              onClick={::this.addPupil}>
                          <span>הוסף תלמיד</span>&nbsp;<i className="fa fa-plus-circle" aria-hidden="true"></i>
                      </Button>
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
                          <Button color="secondary" onClick={() => ::this.toggleModal('')}>ביטול</Button>
                        </ModalFooter>
                      </Modal>

                      <ReactTable
                        className="-striped -highlight tableInCard"
                        data={this.state.pupils}
                        noDataText={this.state.dataStatus}
                        filterable
                        getTheadThProps = { () => {
                          return {
                            style: {
                              'textAlign': 'right',
                              'fontWeight': '700'
                            }
                          }
                        }}
                        getTdProps = { (state, rowInfo, column, instance) => {
                          return {
                            style: {
                              'textAlign': 'right'
                            }
                          }
                        }}
                        loadingText='טוען נתונים...'
                        noDataText='טוען נתונים...'
                        previousText = 'קודם'
                        nextText = 'הבא'
                        pageText = 'עמוד'
                        ofText = 'מתוך'
                        rowsText = 'שורות'
                        columns={[{
                          Header: 'שם מלא',
                          accessor: 'name',
                          style: {
                            lineHeight: '3em'
                          }
                        }, {
                          Header: 'ת.ז.',
                          accessor: 'id',
                          style: {
                            lineHeight: '3em'
                          }
                        }, {
                          Header: 'מספר טלפון',
                          accessor: 'phoneNumber',
                          style: {
                            lineHeight: '3em'
                          }
                        }, {
                          Header: 'תאריך לידה',
                          accessor: 'birthDay',
                          style: {
                            overflow: 'visible',
                            lineHeight: '3em'
                          }
                        },{
                          Header: 'תאריך הרשמה',
                          accessor: 'whenRegistered',
                          style: {
                            lineHeight: '3em',
                            direction: 'ltr'
                          }
                        }, {
                          Header: 'מזהה הורה',
                          accessor: 'parentId',
                          style: {
                            lineHeight: '3em'
                          }
                        }, {
                          Header: 'כתובת',
                          accessor: 'address',
                          style: {
                            lineHeight: '3em'
                          }
                        }, {
                          Header: '',
                          accessor: 'editors',
                          width: 80,
                          Cell: row => {
                            const pupilRecordId = row.original.recordId;
                            return <Row>
                                      <Col md='4'>
                                        <Button disabled={!row.original.isAdmin}
                                                className='btn-round btn-icon btn btn-info btn-sm'
                                                id='btnEditPupil'
                                                style={{
                                                  'padding': '0'
                                                }}
                                                onClick={ () => ::this.editPupil(pupilRecordId) } >
                                          <i className='fa fa-edit'></i>
                                        </Button>
                                      </Col>
                                      <Col md='4'>
                                        <Button disabled={!row.original.isAdmin}
                                                className='btn-round btn-icon btn btn-danger btn-sm'
                                                style={{
                                                  'padding': '0'
                                                }}
                                              onClick={ () => ::this.toggleModal(pupilRecordId) } >
                                              <i className='fa fa-times'></i>
                                        </Button>
                                      </Col>
                                  </Row>
                          }
                        }]}>
                      </ReactTable>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    )
  }
}

export default Group;
