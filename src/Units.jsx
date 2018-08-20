// @flow
import React from 'react';
import { connect } from 'react-redux';
import firebase from './firebase.js';
import classNames from 'classnames';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import Unit from './Unit';
import Groups from './Groups';
import Pagination from './TablePagination';


import { Button, Card, CardBody, Row, Col } from 'reactstrap';

type State = {
  units: [],
  selectedUnit: {
    name: String,
    id: String
  },
  selectedRowIndex: Number,
  dropdownOpen: boolean,
  dataStatus: string
}

const mapStateToProps = (state) => {
  return {
    units: state.units,
    isAdmin: state.isAdmin
  }
}

@connect(mapStateToProps)
export default
class Units extends React.Component<{}, State> {

  state = {
    units: [],
    selectedUnit: {
      name: '',
      id: ''
    },
    selectedRowIndex: -1,
    dropdownOpen: false,
    dataStatus: 'טוען נתונים...'
  };

  toggle() {
     this.setState(prevState => ({
       dropdownOpen: !prevState.dropdownOpen
     }));
  }

  async componentDidUpdate(prevProps: Props, prevState: State) {

    if( this.props.units !== prevProps.units ||
      this.props.isAdmin !== prevProps.isAdmin) {


      const self = this;

      const _units = [];

      this.props.units.forEach( (unit) => {

          _units.push({
            name: unit.name_he,
            education_type: unit.education_type,
            authority: unit.authority,
            region: unit.region,
            cluster: unit.cluster,
            type: unit.type,
            symbol: unit.symbol,
            id: unit.unitId
          });
        //}

      });

      this.setState({
        units: _units,
        dataStatus: _units.length == 0 ? 'No Units are allowed to view for this account'
                                        : this.state.dataStatus
      })
    }
  }

  onUnitSelected = (unit) => {
    this.setState({
      selectedUnit: unit
    })
  }

  onRowSelected = (rowInfo) => {

    this.setState({
      selectedUnit: {
        name: rowInfo.original.name,
        id: rowInfo.original.id
      },
      selectedRowIndex: rowInfo.index
    });
  }

  addUnit() {
    this.props.history.push('/dashboard/addunit/');
  }


  render() {

    let unit = this.state.selectedUnit.id == '' ? null
                : <Unit docId={this.state.selectedUnit.id} />

    const self = this;

    const columns = [{
      Header: '',
      expander: true,
      width: 65,
      Expander: ({ isExpanded, ...rest}) =>
        <div style={{
            lineHeight: '34px'
          }}>
          { isExpanded ?
            <span className='expanderIcon'>&#x2299;</span> :
            <span className='expanderIcon'>&#x2295;</span>
          }
        </div>,
      style: {
        cursor: 'pointer',
        fontSize: 25,
        padding: 0,
        userSelect: 'none',
        textAlign: 'center',
      }
    }, {
      Header: 'רשות',
      accessor: 'authority',
    }, {
      Header: 'מחוז',
      accessor: 'region',
    }, {
      Header: 'שם',
      accessor: 'name',
    }, {
      Header: 'סמל',
      accessor: 'symbol',
    }, {
      Header: 'סוג מוסד',
      accessor: 'type',
    }, {
      Header: 'אשכול',
      accessor: 'cluster',
    }];

    return <div>
              <div className='panel-header panel-header-sm'></div>
              <div className='content container h-100'>
                <Row>
                  <div className='col col-md-12'>
                    <Card>
                      <div className='card-header'>
                        <h5 className='title'>רשימת המוסדות</h5>
                      </div>
                      <div className='card-body'>
                        <Row>
                          <Col md='12' className='d-flex justify-content-end'>
                            <Button color='primary'
                                    className='align-self-end'
                                    disabled={!this.props.isAdmin}
                                    onClick={::this.addUnit}>
                                  <span>הוסף מוסד </span>&nbsp;<i className="fa fa-plus-circle" aria-hidden="true"></i>
                            </Button>
                          </Col>
                          <Col md='12'>
                            <Card>
                              <CardBody>
                                <ReactTable
                                  PaginationComponent={Pagination}
                                  filterable
                                  data={this.state.units}
                                  columns={columns}
                                  showPagination={true}
                                  className="-striped -highlight"
                                  loadingText='טוען נתונים...'
                                  noDataText='טוען נתונים...'
                                  previousText = 'קודם'
                                  nextText = 'הבא'
                                  pageText = 'עמוד'
                                  ofText = 'מתוך'
                                  rowsText = 'שורות'
                                  getTheadThProps = { () => {
                                    return {
                                      style: {
                                        'textAlign': 'right',
                                        'fontWeight': '700'
                                      }
                                    }
                                  }}
                                  SubComponent={ row => {
                                    return (
                                      <div style={{ padding: "20px" }}>
                                          <br />
                                          <Unit docId={row.original.id} />
                                      </div>
                                    )
                                  }}>
                                </ReactTable>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>
                        <Row>
                          <Col xs='12'>
                            {unit}
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  </div>
                </Row>
              </div>
           </div>
  }

}
