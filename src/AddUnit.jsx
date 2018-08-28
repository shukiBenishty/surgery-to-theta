// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Button, Row, Col, Container, Form, FormGroup,
  Card, CardBody, CardTitle,
  Input, InputGroup, InputGroupAddon
} from 'reactstrap';
import DropdownList from 'react-widgets/lib/DropdownList';
import 'react-widgets/dist/css/react-widgets.css';
import classNames from 'classnames';
import firebase from './firebase.js';



type State = {
  invalidField: String,
  selectedAuthority: ?String,
  authorities: String[],
  authoritiesLoaded: Boolean,
  models: String[],
  modelsLoaded: Boolean,
  selectedModel: String,
  unitType: String,
  eduType: String
}

const mapStateToProps = (state) => {
  return {
    groups: Object.values(state.groups),
    units: Object.values(state.units),
    pupils: Object.values(state.pupils),
    isAdmin: state.isAdmin,

  }
}

@connect(mapStateToProps)
export default
class AddUnit extends React.Component<{}, State> {

  state = {
    invalidField: '',
    selectedAuthority: '',
    authorities: [],
    authoritiesLoaded: false,
    models: [],
    modelsLoaded: false,
    selectedModel: '',
    unitType: '',
    eduType: ''
  }

  async componentDidMount() {

    let _authorities = [];
    let _authoritiesLoaded = false;
    try {

      _authorities = this.props.authorities;
      _authoritiesLoaded = true;

    } catch( err ) {
      console.error(err);
    }
    this.setState({
      authorities: _authorities,
      authoritiesLoaded: _authoritiesLoaded
    });

    let _models = [];
    let _modelsLoaded = false;
    try {

      const models = await firebase.firestore().collection('models')
                             .get();
      const modelDocs = models.docs;
      _models = modelDocs.map( doc => {
        const modelData = doc.data();
        return  modelData.number;
      });
      _modelsLoaded = true;

    } catch( err ) {
      console.error(err);
    }

    this.setState({
      models: _models,
      modelsLoaded: _modelsLoaded
    });

  }

  onAuthorityChanged = (authority) => {
    this.setState({
      selectedAuthority: authority.name
    });
  }

  onModelChanged = (modelName) => {
    this.setState({
      selectedModel: modelName
    });
  }

  onFormSubmit = async(event) => {

    event.preventDefault(); // stop from further submit

    const symbol = event.target.symbol.value;

    const unit = {
      authority: this.state.selectedAuthority,
      name_he: event.target.unitName.value,
      symbol: symbol,
      sec_role: 'unit_' + symbol,
      model: this.state.selectedModel,
      type: this.state.unitType,
      education_type: this.state.eduType,
      cluster: 3,
      region: 'מרכז'
    }

    const _unit = await ::this.validateUnit(unit);
    if( !_unit.validated ) {

      this.setState({
        invalidField: unit.invalidField
      },
      () => {
              console.log('Form is invalid.');
      });

      return;

    }

    try {

      // Add new unit to Firestore
      database.addUnit(unit);

      this.props.history.goBack();

    } catch( err ) {
      console.error(err);
    }

  }

  validateUnit(unit) {

    if( unit.authority === '' ) {
      unit.validated = false;
      unit.invalidField = 'authority';
      return unit;
    }

    if( unit.name_he === '' ) {
      unit.validated = false;
      unit.invalidField = 'name';
      return unit;
    }

    if( unit.symbol === '' ) {
      unit.validated = false;
      unit.invalidField = 'symbol';
      return unit;
    }

    if( unit.model === '' ) {
      unit.validated = false;
      unit.invalidField = 'model';
      return unit;
    }

    if( unit.type === '' ) {
      unit.validated = false;
      unit.invalidField = 'type';
      return unit;
    }

    if( unit.education_type === '' ) {
      unit.validated = false;
      unit.invalidField = 'education_type';
      return unit;
    }
    return new Promise( (resolve, reject) => {
      try {
      let unitExsist = this.props.units.find(( _unit )=>{
          return unit.symbol === _unit.symbol
        })
        if (groupExsist){
          unit.validated = false;
          unit.invalidField = 'symbol';
          resolve(group);
        } else {
          unit.validated = true;
          resolve(unit);
        }
      } catch( err ) {
        reject(err);
      }

    })

  }

  render() {

    const unitTypes = ['בי"ס', 'גן', 'בי"ס יוח"א '];
    const eduTypes = ['רגיל', 'מיוחד'];

    let isThisField = this.state.invalidField === 'symbol';
    const symbolClassNames = classNames({
      'text-left my-auto' : true,
      'text-danger': isThisField,
      'visible': isThisField,
      'invisible': !isThisField
    });

    isThisField = this.state.invalidField === 'name';
    const unitNameClassNames = classNames({
      'text-left my-auto' : true,
      'text-danger': isThisField,
      'visible': isThisField,
      'invisible': !isThisField
    })

    isThisField = this.state.invalidField === 'authority';
    const authorityClassNames = classNames({
      'text-left my-auto' : true,
      'text-danger': isThisField,
      'visible': isThisField,
      'invisible': !isThisField
    })

    isThisField = this.state.invalidField === 'model';
    const modelClassNames = classNames({
      'text-left my-auto' : true,
      'text-danger': isThisField,
      'visible': isThisField,
      'invisible': !isThisField
    })

    isThisField = this.state.invalidField === 'type';
    const typeClassNames = classNames({
      'text-left my-auto' : true,
      'text-danger': isThisField,
      'visible': isThisField,
      'invisible': !isThisField
    })

    isThisField = this.state.invalidField === 'education_type';
    const eduTypeClassNames = classNames({
      'text-left my-auto' : true,
      'text-danger': isThisField,
      'visible': isThisField,
      'invisible': !isThisField
    })

    return (<div>
      <div className='panel-header panel-header-sm'></div>
        <div className='content container h-100'>
          <Row>
            <Col className='col-md-12'>
              <Card body className="text-center">
                <div className='card-header'>
                  <h5 className='title'>הוספת מוסד חדש</h5>
                </div>
                <CardBody>
                  <Card>
                    <CardBody>
                      <Form onSubmit={::this.onFormSubmit}>
                        <Container>
                          <Row>
                            <Col md={{ size: 2, offset: 2 }} className="text-right my-auto">
                              <div className='info-text'>רשות</div>
                            </Col>
                            <Col md='4' className="text-left">
                              <DropdownList filter busy={!this.state.authoritiesLoaded}
                                textField='name'
                                groupBy='region'
                                data={this.state.authorities}
                                onChange={ value => ::this.onAuthorityChanged(value) }/>
                            </Col>
                            <Col md='4' invalid={(this.state.invalidField === 'authotity').toString()}
                              className={authorityClassNames}>
                              אנא הזן ערך
                            </Col>
                          </Row>
                          <br />
                          <Row>
                            <Col md={{ size: 2, offset: 2 }} className="text-right my-auto">
                              <div className='info-text'>שם מוסד</div>
                            </Col>
                            <Col md={{ size: 4 }}>
                              <Input id='unitName' name='unitName'></Input>
                            </Col>
                            <Col md='4' invalid={(this.state.invalidField === 'groupName').toString()}
                              className={unitNameClassNames}>
                              אנא הזן ערך
                            </Col>
                          </Row>
                          <br />
                          <Row>
                            <Col md={{ size: 2, offset: 2 }} className="text-right my-auto">
                              סמל
                            </Col>
                            <Col md='4'>
                                <Input id='symbol' name='symbol'
                                        type='number' placeholder="רק מספרים שלמים" />
                            </Col>
                            <Col md='4' invalid={(this.state.invalidField === 'symbol').toString()}
                              className={symbolClassNames}>
                              מוסד עם סמל כזה כבר קיים במערכת
                            </Col>
                          </Row>
                          <br />
                          <Row>
                            <Col md={{ size: 2, offset: 2 }} className="text-right my-auto">
                              מודל
                            </Col>
                            <Col md='4' className="text-left">
                              <DropdownList
                                data={this.state.models}
                                busy={!this.state.modelsLoaded}
                                onChange={ model => ::this.onModelChanged(model) }
                                />
                            </Col>
                            <Col md='4' invalid={(this.state.invalidField === 'model').toString()}
                              className={modelClassNames}>
                              אנא הזן ערך
                            </Col>
                          </Row>
                          <br />
                          <Row>
                            <Col md={{ size: 2, offset: 2 }} className="text-right my-auto">
                              <div className='info-text'>סוג מוסד</div>
                            </Col>
                            <Col md='4' className="text-left">
                              <DropdownList
                                data={unitTypes}
                                onChange={ value => this.setState({
                                                                    unitType: value
                                                                  }) }/>
                            </Col>
                            <Col md='4' invalid={(this.state.invalidField === 'type').toString()}
                              className={typeClassNames}>
                              אנא הזן ערך
                            </Col>
                          </Row>
                          <br />
                          <Row>
                            <Col md={{ size: 2, offset: 2 }} className="text-right my-auto">
                              <div className='info-text'>סוג חינוך</div>
                            </Col>
                            <Col md='4' className="text-left">
                              <DropdownList
                                data={eduTypes}
                                onChange={ value => this.setState({
                                                                    eduType: value
                                                                  }) }/>
                            </Col>
                            <Col md='4' invalid={(this.state.invalidField === 'education_type').toString()}
                              className={eduTypeClassNames}>
                              אנא הזן ערך
                            </Col>
                          </Row>
                          <Row>
                            <Col md={{ size: 1, offset: 10}}>
                              <Button type="submit" color='primary'>הוסף</Button>
                            </Col>
                          </Row>
                        </Container>
                      </Form>
                    </CardBody>
                  </Card>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    )
  }

}
