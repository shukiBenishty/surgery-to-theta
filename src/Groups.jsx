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


type Group = {
    id: String,
    unitId: String,
    name: String,
    symbol: String,
    authority: String,
    capacity: Number,
    openFrom: Date,
    openTill: Date,
    unitName: String,
    price: Number
}

type State = {
  groups: Group[],
  authorities: String[],
  authoritiesLoaded: Boolean,
  selectedAuthorities: String[],
  loading: Boolean,
  tooltipOpen: Boolean,
  modal: Boolean,
  groupId2Delete: String
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
class Groups extends React.Component<{}, State> {

  state = {
    groups: [],
    authorities: [],
    authoritiesLoaded: false,
    selectedAuthorities: [],
    loading: true,
    tooltipOpen: false,
    modal: false,
    groupId2Delete: ''

  }

  async loadAuthorities(authorities) {
    this.setState({
      authorities: authorities,
      authoritiesLoaded: true
    })
  }

  async loadGroups(groups, units) {

    try {
      let _groups = groups.map(( group) => {

          // const openTill = group.openTill ?
          //                 moment.unix(group.openedTill.seconds).format('DD/MM/YYYY') :
          //

          // return {
          //   id: group.groupId,
          //   unitId: group.unitId,
          //   name: group.name,
          //   symbol: group.symbol,
          //   openTill: group.openTill,
          //   openFrom: group.openFrom,
          //   unitName: group.unitName,
          //   authority: group.authority,
          //   price: group.price,
          //   capacity: group.capacity,
          //   isAdmin: this.props.isAdmin
          // };
          let _unit = units[group.metadata.unitId];
          let _authority = (_unit) ? _unit.authority : undefined;
          return {
            id: group.metadata.groupId,
            unitId: group.metadata.unitId,
            name: group.name,
            symbol: group.symbol,
            openTill: group.openTill,
            openFrom: group.openFrom,
            unitName: group.unitName,
            authority: _authority,
            price: group.price,
            capacity: group.capacity,
            isAdmin: this.props.isAdmin
          };
      });
      this.setState({
        loading: false,
        groups: _groups
      })


    } catch( err ) {
      return new Error(err);
    }

  }

  componentDidMount(){
    ::this.loadGroups(this.props.groups, this.props.units);
    ::this.loadAuthorities(this.props.authorities);
  }

  shouldComponentUpdate(nextProps, nextState) {

    if( nextProps.isAdmin !== this.props.isAdmin ||
        nextProps.groups !== this.props.groups ||
        nextProps.units !== this.props.units) {
        ::this.loadGroups(nextProps.groups, this.props.units);
    }
    if (nextProps.authorities !== this.props.authorities){
      ::this.loadAuthorities(nextProps.authorities);
    }
    if(nextState !== this.state){
      return true;
    } else {
      return false;
    }
  }


  toggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
  }

  exportExcel() {

    const _export = {
      /* Array of Arrays e.g. [["a","b"],[1,2]] */
     data: [
       ["", "שם", "מזהה", "כמות ילדים ", "שם מוסד", "ת. התחלה", "ת.סיום", "מחיר"],
//       ["", "מחיר", "ת.סיום", "ת. התחלה", "שם מוסד", "כמות ילדים", "מזהה", "שם"],
     ],
    };

    this.state.groups.forEach( (group, index) => {
        const groupData = [];
        groupData.push(1 + index); // reserve 1 for caption row
        groupData.push(group.name);
        groupData.push(group.symbol);
        groupData.push(group.capacity);
        groupData.push(group.unitName);
        groupData.push(group.openFrom);
        groupData.push(group.openTill);
        groupData.push(group.price);

        _export.data.push(groupData);
    });

    /* create a new blank workbook */
    var workbook = XLSX.utils.book_new();
    console.log(workbook.Views);
    /* convert from array of arrays to workbook */
    var worksheet = XLSX.utils.aoa_to_sheet(_export.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'כיתות');

    /* create view to RTL */
    if(!workbook.Workbook) workbook.Workbook = {};
    if(!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if(!workbook.Workbook.Views[0]) workbook.Workbook.Views[0] = {};
    workbook.Workbook.Views[0].RTL = true;

    /* write a workbook */
    XLSX.writeFile(workbook, 'groups.xlsx');

  }

  async updateFirestore(groupIndex: Number,
                        groupId: String,
                        unitId: String,
                        fieldName: String,
                        value) {

     const data = [...this.state.groups];
     data[groupIndex][fieldName] = value;
     this.setState({
       groups: data
     });

     try {
        let json = {};
        const updateField = fieldName;
        json[updateField] = value;

        database.updateGroup(unitId, groupId, json)

     } catch( err ) {
       console.error(err);
     }

  }

  onAuthorityChanged = (authorities) => {

    const _authorities = authorities.map( authority => {
      return authority.name
    });

    const _groups = this.state.groups.filter( group => {
      return _authorities.find( authorityName => {
        return authorityName === group.authority}
      )
    });

    this.setState({
      selectedAuthorities: _authorities,
      groups: _groups
    });
  }

  editGroup(unitId: String,
            groupId: String) {
    //console.log(`UnitId: ${unitId}. GroupId: ${groupId}`);
    this.props.history.push(`/dashboard/addgroup/${unitId}/${groupId}`);
  }

  toggleModal(groupId: String) {
    this.setState({
      modal: !this.state.modal,
      groupId2Delete: groupId
    });
  }

  deleteGroup() {
    //console.log(`UnitId: ${this.props.docId}. GroupId: ${this.state.groupId2Delete}`);
    this.setState({
      modal: !this.state.modal
    });
  }

  render() {

    const columns = [{
      Header: 'שם כיתה',
      accessor: 'name',
      style: {
        lineHeight: '3em'
      }
    }, {
      Header: 'מזהה',
      accessor: 'symbol',
      style: {
        lineHeight: '3em'
      }
    }, {
      Header: 'כמות ילדים',
      accessor: 'capacity',
      width: 80,
      style: {
        lineHeight: '3em'
      }

    }, {
      Header: 'שם מוסד',
      accessor: 'unitName',
      style: {
        lineHeight: '3em'
      }
    }, {
      Header: 'ת. התחלה',
      accessor: 'openFrom',
      style: {
        overflow: 'visible',
        lineHeight: '3em'
      }
    }, {
      Header: 'ת.סיום',
      accessor: 'openTill',
      style: {
        overflow: 'visible',
        lineHeight: '3em'
      }
    }, {
      Header: 'מחיר',
      accessor: 'price',
      width: 80,
      style: {
        lineHeight: '3em'
      }
    }, {
      Header: '',
      accessor: 'editors',
      width: 80,
      Cell: row => {
        const groupId = row.original.id;
        const unitId = row.original.unitId;
        return <Row>
          <Col md='4'>
            <Button disabled={!row.original.isAdmin}
                    className='btn-round btn-icon btn btn-info btn-sm'
                    style={{
                      'padding': '0'
                    }}
                    onClick={ () => ::this.editGroup(unitId, groupId) } >
              <i className='fa fa-edit'></i>
            </Button>
          </Col>
          <Col md='4'>
            <Button disabled={!row.original.isAdmin}
                    className='btn-round btn-icon btn btn-danger btn-sm'
                    style={{
                      'padding': '0'
                    }}
                    onClick={ () => ::this.toggleModal(groupId) } >>
              <i className='fa fa-times'></i>
            </Button>
          </Col>
        </Row>
      }
    }];

    const self = this;

    return <div>
              <div className='panel-header panel-header-sm'></div>
              <Container className='content h-100'>
                <Modal isOpen={this.state.modal}>
                  <ModalHeader>
                    מחיקת קבוצה
                  </ModalHeader>
                  <ModalBody>
                    אישור לפעולה זו תגרום לחיקה מוחלטת של כל נתוני הקבוצה, כולל רשימות הנרשמים. זאת פעולה לא הפיכה.
                  </ModalBody>
                  <ModalFooter>
                    <Button color="primary" onClick={::this.deleteGroup}>אישור</Button>{' '}
                    <Button color="secondary" onClick={() => ::this.toggleModal('')}>ביטול</Button>
                  </ModalFooter>
                </Modal>
                <Row>
                  <Col md='12'>
                    <Card>
                      <CardHeader>
                        <h5 className='title'>ניהול כיתות</h5>
                      </CardHeader>
                      <CardBody>
                        <Row className='align-items-center'>
                          <Col md='3'>
                            <Multiselect
                              busy={!this.state.authoritiesLoaded}
                              groupBy='region'
                              textField='name'
                              isRtl={true}
                              placeholder='סנן לפי הרשות'
                              data={this.state.authorities}
                              onChange={ value => ::this.onAuthorityChanged(value) }
                            />
                          </Col>
                          <Col md={{ size: 2, offset: 10 }}
                              className='text-right my-auto' id='tooltipContainer'>
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
                        </Row>
                        <Row>
                          <Col md='12'>
                            <ReactTable
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
                              loading = {this.state.loading}
                              loadingText='טוען נתונים...'
                              noDataText='אין נתונים להצגה'
                              previousText = 'קודם'
                              nextText = 'הבא'
                              pageText = 'עמוד'
                              ofText = 'מתוך'
                              rowsText = 'שורות'
                              data={this.state.groups}
                              columns={columns}/>
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

export default withRouter(Groups)
