import { FormControl } from '@angular/forms';

export interface ValidationResult {
  [key: string]: boolean;
}

export function requiredFileType(type: string): (control: FormControl) => ValidationResult | null {
  return function (control: FormControl): ValidationResult | null {
    const file = control.value;

    if (!file) {
      return null;
    }

    const extension = file.name.split('.')[1].toLowerCase();
    if (type.toLowerCase() !== extension.toLowerCase()) {
      return {
        requiredFileType: true
      };
    }

    return null;
  };
}
