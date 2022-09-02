import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-wide-buttons-centered',
  templateUrl: './wide-buttons-centered.component.html'
})
export class WideButtonsCenteredComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('WideButtonsCenteredComponent init');
  }
}
