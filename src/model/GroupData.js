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
              openFrom: Timestamp,
              openTill: Timestamp,
              payments: Number) {
    this.name = ( name || '');
    this.symbol = ( symbol || '');
    this.capacity = ( capacity || 0);
    this.price = ( price || '');
    this.openFrom = ( openFrom || openFrom.seconds)? moment.unix(openFrom.seconds): openFrom;
    this.openTill = ( openTill || openTill.seconds)? moment.unix(openTill.seconds): openTill;
    this.payments =  ( payments || 0);
  }
}
