// @flow
import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import ReactTable from 'react-table';
import { Row, Col, Button,
  Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import moment from 'moment';
import http from 'http';
import firebase from './firebase.js';
import database from './firebase-database.js'


type Props = {
  unitId: String
}

type Group = {
  name: String,
  symbol: String,
  opened: String, // assume already converted from Firebase Timestamp to 'DD/MM/YYYY'
  closed?: String,
  price: String,
  capacity: Number,
  registeredPupils: Number
}

type State = {
  groups: Group[],
  dataStatus: string,
  modal: Boolean,
  groupId2Delete: String
}

const mapStateToProps = (state) => {
  return {
    groups: state.groups,
    isAdmin: state.isAdmin,
    userPermissisionId: state.userPermissisionId
  }
}

@withRouter
@connect(mapStateToProps)
export default
class UnitGroups extends React.Component<Props, State> {

  state = {
    groups: [],
    dataStatus: 'טוען נתונים...',
    modal: false,
    groupId2Delete: ''
  }

  shouldComponentUpdate(nextProps, nextState) {

    if( nextProps.groups !== this.props.groups) {
      ::this._loadcData()
    }
    if(nextState !== this.state){
      return true;
    } else {
      return false;
    }
  }

  componentWillUnmount() { // is called upon closing
                           // each expander in Units.jsx
    if( this.unregisterCollectionObserver ) {
      this.unregisterCollectionObserver();
    }

  }

  componentDidMount() {
    ::this._loadcData(this.props.unitId);
  }


  _loadcData() {
    const isAdmin = this.props.isAdmin;
    let _groups = database.getAllGroupsInUnit(this.props.unitId);
    if (_groups) {
      ::this.groupsFromDocs(_groups, isAdmin);
    }
  }

  groupsFromDocs(docs, isAdmin: Boolean) {

    let _groups: Group[] = [];

    docs.forEach( (group, index) => {

      let writePermissions = false;
      if( group.metadata.permissions ) {
         let permissions = group.metadata.permissions[this.props.userPermissisionId];
         if( permissions ) {
           writePermissions = permissions.write || false;
        }
      }

        let registeredPupils = ( group.registeredPupils || 0 );

        _groups.push({
          ...group,
          id: group.metadata.groupId,
          price: group.price + ' ₪',
          registeredPupils: registeredPupils,
          isAdmin: isAdmin,
          writeEnabled: writePermissions
        });

    });

    this.setState({
      groups: _groups,
      dataStatus: _groups.length == 0 ? 'No Groups are allowed to view for this account'
                                      : this.state.dataStatus
    });

  }

  renderEditable(cellInfo) {
      return (<div
        style={{ backgroundColor: "#fafafa" }}
        suppressContentEditableWarning
        contentEditable
        onBlur={e => {
                  const value = e.target.innerHTML;
                  if( value ) {
                    const data = [...this.state.groups];
                    data[cellInfo.index][cellInfo.column.id] = value;
                    this.setState({ data });
                  }
                }}>
      </div>);
  }

  renderCheckable(cellInfo) {

    const groupData = this.state.groups[cellInfo.index];
    const _isClosed = groupData.isClosed;

    return (
      <div className='form-check'
        style={{
          marginTop: '-16px'
        }}>
        <label className='form-check-label'>
          <input className='form-check-input'
            type='checkbox'
            className='checkbox'
            checked={_isClosed}
            onChange={ () => ::this.toggleIsClosed(cellInfo.index) }
          />
          <span className='form-check-sign'></span>
       </label>
     </div>)
  }

  async toggleIsClosed(index) {

    try {

      const groupData = this.state.groups[index];
      groupData.isClosed = !groupData.isClosed;
      this.setState({
        groups: this.state.groups
      })

      let rishumonStatus = ( groupData.isClosed  ) ? "4" : "1"; // Statuses: 1 - Open
                                                                //           4 - Close

      const data2post = {
        "groupSymbol": groupData.symbol,
        "description": groupData.name,
        "status": rishumonStatus,
        "price": groupData.price
      };

      await fetch('https://rishumon.com/api/elamayn/edit_class.php?secret=Day1%21', {
        // headers: {
        //     "Content-Type": "application/json",
        // },
        mode: 'no-cors',
        method: 'POST',
        body: JSON.stringify(data2post)
      })

      database.updateGroup(this.props.unitId, groupData.id, groupData);

    } catch( err ) {
      console.error(err);
    }

  }

  onRowSelected = (rowInfo) => {
    if( rowInfo ) {
      this.props.history.push(`/dashboard/group/${this.props.unitId}/${rowInfo.original.id}`);
    }
  }

  editGroup(groupId: String) {
    //console.log(`UnitId: ${this.props.docId}. GroupId: ${groupId}`);
    this.props.history.push(`/dashboard/addgroup/${this.props.unitId}/${groupId}`);
  }

  toggleModal(unitId: String, groupId: String, group) {
    this.setState({
      modal: !this.state.modal,
      group2Delete: group,
      groupId2Delete: groupId,
      unitId2Delete: unitId,
    });
  }

  deleteGroup() {
    //console.log(`UnitId: ${this.props.docId}. GroupId: ${this.state.groupId2Delete}`);
    this.setState({
      modal: !this.state.modal
    });

    const data2post = {
      "groupSymbol": this.state.group2Delete.symbol,
      "description": '',
      "status": "4",
      "price": this.state.group2Delete.price,
      "paymentInstallments": this.state.group2Delete.paymentInstallments
    };

    fetch('https://rishumon.com/api/elamayn/edit_class.php?secret=Day1%21', {
      // headers: {
      //     "Content-Type": "application/json",
      // },
      mode: 'no-cors', // no-cors prevents reading the response
      method: 'POST',
      body: JSON.stringify(data2post)
    }).then(() => {
        database.deleteGroupById(this.props.unitId, this.state.groupId2Delete);
    });

  }

  render() {

    const self = this;

    return (<React.Fragment>
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
      <ReactTable
        className="-striped -highlight tableInCard col col-12"
        data={this.state.groups}
        noDataText={this.state.dataStatus}
        filterable
        defaultPageSize={5}
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
            onClick: (e, handleOriginal) => {
              if( column.id != 'isClosed'
                  && column.id != 'editors') {
                self.onRowSelected(rowInfo);
              }
            },
            style: {
              'textAlign': 'right'
            }
          }
        }}
        getTrProps={(state, rowInfo, column) => {
            return {
              style: {
                cursor: 'pointer',
                'textAlign': 'left'
              }
            }
        }}
        columns={[{
           Header: 'שם',
           accessor: 'name',
           style: {
            lineHeight: '3em'
            }
         }, {
           Header: 'סמל',
           accessor: 'symbol',
           style: {
              lineHeight: '3em'
           }
         }, {
           Header: 'מחיר',
           accessor: 'price',
           style: {
              lineHeight: '3em'
           }
         }, {
            Header: 'תאריך פתיחה',
            accessor: 'openFrom',
            style: {
              lineHeight: '3em'
            }
          }, {
           Header: 'כמות מקומות',
           accessor: 'capacity',
           style: {
              lineHeight: '3em'
           }
          }, {
           Header: 'תלמידים רשומים',
           accessor: 'registeredPupils',
           Cell: row => {

              const capacity = row.original.capacity;
              let percentage = 0;
              if( row.original.registeredPupils && row.original.registeredPupils > 0 ) {
                percentage = Math.round(row.value / capacity * 100);
              }

             return (
               <div style={{
                 width: '100%',
                 height: '75%'
               }}>
                 <div style={{
                     width: percentage,
                     backgroundColor: percentage > 66 ? '#f44336'
                      : percentage > 33 ? '#ffbf00'
                      : 'green',
                     height: '100%',
                     borderRadius: '2px',
                     transition: 'all .2s ease-out'
                   }}>
                   {row.value}/{capacity}
                 </div>
               </div>)
           },
            style: {
              lineHeight: '3em'
            }
         }, {
            Header: 'כיתה סגורה',
            accessor: 'isClosed',
            Cell: ::this.renderCheckable,
            style: {
              lineHeight: '3em'
            }
        }, {
          Header: '',
          accessor: 'editors',
          width: 80,
          Cell: row => {
            const groupId = row.original.id;
            return <Row>
                      <Col md='4'>
                        <Button disabled={!(row.original.writeEnabled || row.original.isAdmin)}
                                className='btn-round btn-icon btn btn-info btn-sm'
                                style={{
                                  'padding': '0'
                                }}
                                onClick={ () => ::this.editGroup(groupId) } >
                          <i className='fa fa-edit'></i>
                        </Button>
                     </Col>
                     <Col md='4'>
                      <Button disabled={!(row.original.writeEnabled || row.original.isAdmin)}
                              className='btn-round btn-icon btn btn-danger btn-sm'
                                style={{
                                  'padding': '0'
                                }}
                              onClick={ () => ::this.toggleModal(this.props.unitId, groupId, row.original) } >
                        <i className='fa fa-times'></i>
                      </Button>
                     </Col>
                  </Row>
          }
        } ]}
        loadingText = 'טוען נתונים...'
        noDataText = 'אין נתונים'
        previousText = 'קודם'
        nextText = 'הבא'
        pageText = 'עמוד'
        ofText = 'מתוך'
        rowsText = 'שורות'
        >
     </ReactTable>
     </React.Fragment>
   )
  }

}
