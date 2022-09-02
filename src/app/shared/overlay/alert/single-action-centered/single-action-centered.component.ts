import { Component, OnInit } from '@angular/core';
import { modalAnimated } from '../../../animation/trigger';

@Component({
  selector: 'app-single-action-centered',
  templateUrl: './single-action-centered.component.html',
  animations: [modalAnimated]
})
export class SingleActionCenteredComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('SingleActionCenteredComponent init');
  }
}
