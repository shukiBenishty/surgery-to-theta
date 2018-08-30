// @flow
import React from 'react';
import { connect } from 'react-redux';
import firebase from './firebase.js';
import { Card, CardHeader, CardBody, Row, Col } from 'reactstrap';
import ReactTable from 'react-table';
import Pagination from './TablePagination';
import UserPermissions from './UserPermissions';

type State = {
  users: [],
  loading: Boolean
}

const mapStateToProps = (state) => {
  return {
    users: state.users
  }
}

@connect(mapStateToProps)
class UserList extends React.Component<{}, State> {

  state = {
    users: [],
    sorting: [{ columnName: 'first_name', direction: 'asc' }],
    loading: true
  }


  componentDidMount() {

      const _users = [];

      // this.props.users.forEach( (_data) => {
      //   _users.push({
      //     userId: _data.metadata.userId,
      //     first_name: _data.first_name,
      //     last_name: _data.last_name,
      //     email: _data.email,
      //     role: _data.role
      //   });
      //
      // });

      this.setState({
        loading: false,
        users: _users
      })

  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.users !== this.props.users) {
      this.setState({
        users: nextProps.users
      })
    }
    if (nextState !== this.state) {
      return true;
    } else {
      return false;
    }
  }

  render() {

    const { users, sorting } = this.state;

    const _columns = [{
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
          textAlign: 'center'
        }
      },
      { Header: 'שם פרטי', accessor: 'first_name' },
      { Header: 'שם משפחה', accessor: 'last_name' },
      { Header: 'תפקיד', accessor: 'role' },
      { Header: 'אי-מייל', accessor: 'email' }
    ];

    return (
      <div>
        <div className='panel-header panel-header-sm'></div>
        <div className='content'>
          <Card>
            <CardHeader>
              <h5 className='title'>רשימת משתמשים</h5>
            </CardHeader>
            <CardBody>
              <Row>
              <Col md='12'>
                <ReactTable
                  className="-striped -highlight tableInCard col col-12"
                  PaginationComponent={Pagination}
                  filterable
                  pageSize={10}
                  data={users}
                  columns={_columns}
                  getTheadThProps = { () => {
                    return {
                      style: {
                        'textAlign': 'right'
                      }
                    }
                  }}
                  loadingText='טוען נתונים...'
                  noDataText='אין נתונים להצגה'
                  loading = {this.state.loading}
                  previousText = 'קודם'
                  nextText = 'הבא'
                  pageText = 'עמוד'
                  ofText = 'מתוך'
                  rowsText = 'שורות'
                  SubComponent={ row => {
                    console.log(row.original.metadata.userId);
                    return (
                      <div style={{ padding: "20px" }}>
                          <br />
                          <UserPermissions userId={row.original.metadata.userId} />
                      </div>
                    )
                  }}
                  />
              </Col>
            </Row>
            </CardBody>
          </Card>
        </div>
      </div>
    );

  }

};

export default UserList;
