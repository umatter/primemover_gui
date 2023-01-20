import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html'
})
export class ButtonComponent {
  @Input() size: string;
  @Input() type: string;
  @Input() text: string = 'Button';
  @Input() disabled: boolean = false;

  constructor() {}

  extraSmall = (): boolean => this.size === 'xs';
  small = (): boolean => this.size === 'sm';
  medium = (): boolean => this.size === 'md';
  large = (): boolean => this.size === 'lg';
  extraLarge = (): boolean => this.size === 'xl';

  primary = (): boolean => this.type === 'primary';
  secondary = (): boolean => this.type === 'secondary';
  white = (): boolean => this.type === 'white';
  icon = (): boolean => this.type === 'icon';
  trailingIcon = (): boolean => this.type === 'trailing-icon';
  round = (): boolean => this.type === 'round';
  circular = (): boolean => this.type === 'circular';
}
