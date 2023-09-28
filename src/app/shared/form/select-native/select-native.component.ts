import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { AsyncPipe, NgForOf } from '@angular/common';

@Component({
  selector: 'app-select-native',
  templateUrl: './select-native.component.html',
  imports: [ReactiveFormsModule, NgForOf, AsyncPipe],
  standalone: true
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
