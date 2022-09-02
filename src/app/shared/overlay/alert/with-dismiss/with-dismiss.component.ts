import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-alert-with-dismiss',
  templateUrl: './with-dismiss.component.html'
})
export class WithDismissComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('WithDismissComponent init');
  }
}
