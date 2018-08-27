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
  selectedUnit: Unit,
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
      unitName: '',
      metadata: {
        unitId: ''
      },
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

  async componentDidMount() {
      const _units = this.props.units;
      this.setState({
        units: _units,
        dataStatus: _units.length == 0 ? 'No Units are allowed to view for this account'
                                        : this.state.dataStatus
      })
  
  }

  shouldComponentUpdate(nextProps, nextState) {
    if( this.props.units !== nextProps.units ||
      this.props.isAdmin !== nextProps.isAdmin) {
      const self = this;

      const _units = nextProps.units;
      // nextProps.units.forEach( (unit) => {
      //     _units.push({
      //                   ...unit,
      //       id: unit.metadata.unitId
      //     });
      // });

      this.setState({
        units: _units,
        dataStatus: _units.length == 0 ? 'No Units are allowed to view for this account'
                                        : this.state.dataStatus
      })
    }
    if(nextState !== this.state){
      return true;
    } else {
      return false;
    }
  }
  onUnitSelected = (unit) => {
    this.setState({
      selectedUnit: unit
    })
  }

  onRowSelected = (rowInfo) => {

    // this.setState({
    //   selectedUnit: {
    //     unitName: rowInfo.original.unitName,
    //     id: rowInfo.original.metadata.unitId
    //   },
    //   selectedRowIndex: rowInfo.index
    // });
    this.setState({
      selectedUnit: rowInfo.original,
      selectedRowIndex: rowInfo.index
    });
  }

  addUnit() {
    this.props.history.push('/dashboard/addunit/');
  }


  render() {

    let unit = (this.state.selectedUnit.metadata &&
                this.state.selectedUnit.metadata.unitId) == '' ? null
                : <Unit unitId={this.state.selectedUnit.metadata.unitId} />

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
      accessor: 'unitName',
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
                                          <Unit unitId={row.original.metadata.unitId} />
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
