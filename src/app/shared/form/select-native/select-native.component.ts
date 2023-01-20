import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Crawler } from '../../../crawler/model/crawler';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-select-native',
  templateUrl: './select-native.component.html'
})
export class SelectNativeComponent implements OnInit {
  @Input() options$: Observable<any>;
  @Input() selected$: Observable<any>;
  form: UntypedFormGroup;
  // dataCollection: Crawler[] = [];

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    // this.options$.subscribe((response) => (this.dataCollection = response.data));
    // this.form = this.fb.group({
    //   collection: this.dataCollection
    // });
    // this.form.get('collection')?.valueChanges.subscribe((f) => {
    //   this.onValueChanged(f);
    // });
    this.setDefaults();
  }

  onValueChanged(value: any) {}

  setDefaults() {
    this.form.get('collection')?.patchValue(null);
  }

  submit() {}

  clicked(test: any) {}
}
