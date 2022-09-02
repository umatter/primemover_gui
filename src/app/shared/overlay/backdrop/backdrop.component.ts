import { Component, OnInit } from '@angular/core';
import { backdropAnimated } from '../../animation/trigger';

@Component({
  selector: 'app-backdrop',
  templateUrl: './backdrop.component.html',
  animations: [backdropAnimated]
})
export class BackdropComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('BackdropComponent init');
  }
}
