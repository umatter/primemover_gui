import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'euFormat'
})
export class euFormat implements PipeTransform {
  transform(value: any, formatType: string): any {
    const seperator = formatType[formatType.search(/[-/]/g)];
    // format the date
    let val = moment(value)
      .format(formatType)
      .toString()
      .split(seperator)
      .map((v: any) => (v.length > 2 ? v : parseInt(v)))
      .join(seperator);

    return moment(value).format(formatType);
  }
}
