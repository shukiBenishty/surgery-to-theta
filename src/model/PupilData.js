// @flow
import moment from 'moment';

export default
class Pupil {
  recordId: String;
  name: String;
  lastName: String;
  id: String;
  phoneNumber: String;
  medicalLimitations: Boolean;
  birthDay: String;
  whenRegistered: Timestamp;
  parentId: String;
  address: String;
  isAdmin: Boolean;

  constructor(recordId: String,
              name: String,
              lastName: String,
              id: String,
              phoneNumber: String,
              medicalLimitations: Boolean,
              birthDay: String,
              whenRegistered: Timestamp,
              parentId: String,
              address: String,
              isAdmin: Boolean) {

    this.recordId = ( recordId ||  '');
    this.name = ( name ||  '');
    this.lastName = ( lastName || '');
    this.id = ( id || '');
    this.phoneNumber = ( phoneNumber || '');
    this.medicalLimitations = medicalLimitations;
    this.birthDay = ( birthDay || birthDay.seconds) ?
                          moment.unix(birthDay.seconds).format('DD/MM/YYYY') :
                          birthDay;

    this.whenRegistered = ( whenRegistered || whenRegistered.seconds) ?
                          moment.unix(whenRegistered.seconds)
                          .utcOffset(0)
                          .format('DD/MM/YYYY HH:mm') :
                          whenRegistered;
    this.parentId = ( parentId || '');
    this.address = ( address ||  '');
    this.isAdmin = isAdmin;
  }
}
