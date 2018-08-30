import moment from 'moment';

export default
class GroupData {
  name: String;
  symbol: String;
  capacity: Number;
  price: Number;
  openFrom: Number;
  openTill: Number;
  payments: Number;

  constructor(name: String,
              symbol: String,
              capacity: Number,
              price: Number,
              openFrom: String,
              openTill: String,
              payments: Number) {
    this.name = ( name || '');
    this.symbol = ( symbol || '');
    this.capacity = ( capacity || 0);
    this.price = ( price || '');
    this.openFrom =  moment(openFrom, "DD/MM/YYYY"),
    this.openTill = moment(openTill, "DD/MM/YYYY"),
    this.payments =  ( payments || 0);
  }
}
