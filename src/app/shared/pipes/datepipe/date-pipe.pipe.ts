import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'euFormat'
})
export class euFormat implements PipeTransform {
  transform(date: Date): string {
    return moment(date).format('MM.DD.yyyy');
  }
}
