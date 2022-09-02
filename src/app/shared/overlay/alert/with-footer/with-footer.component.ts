import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-alert-with-footer',
  templateUrl: './with-footer.component.html'
})
export class WithFooterComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('WithFooterComponent init');
  }
}
