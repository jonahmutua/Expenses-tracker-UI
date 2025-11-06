import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export class CustomValidators {
/**
 * 
 * @param firstKey - firstfield value
 * @param secondKey - secondfield value
 * @returns - validator fun, that sets an error with key ('fieldMisMatch) to signal mismatch between the two field values.
 */
  static matchFields(firstKey: string, secondKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
    

    if (!(group instanceof FormGroup)) return null;

    const firstControl = group.get(firstKey);
    const secondControl = group.get(secondKey);

    if (!(firstControl instanceof FormControl) || !(secondControl instanceof FormControl)) {
      return null; // invalid form structure
    }

    const firstValue = firstControl.value;
    const secondValue = secondControl.value;

    // If both fields are empty, we let the `Validators.required` handle it
    if (!firstValue && !secondValue) return null;

    // If one field is filled but not the other, we still wait for both to be touched
    if (!firstValue || !secondValue) {
      // Only remove mismatch if previously set
      if (secondControl.hasError('fieldMisMatch')) {
        secondControl.setErrors(null);
      }
      return null;
    }

    // If values mismatch
    if (firstValue !== secondValue) {
      const existingErrors = secondControl.errors || {};
      secondControl.setErrors({ ...existingErrors, fieldMisMatch: true });
    } else {
      // Clear only the mismatch error (preserve others)
      if (secondControl.hasError('fieldMisMatch')) {
        const { fieldMisMatch, ...otherErrors } = secondControl.errors ?? {};
        secondControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
    }

    return null; // always return null for group-level validator
  
    };
  }

  /**
   * check wether a field contains whitespaces(space, tab, newline).
   * If leading/trailing whitespaces are present trims them and updates control silently else raise an error.
   */
  static hasWhiteSpace(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    // Trim leading/trailing spaces
    const trimmed = (control.value as string).trim();

    // // Update the control’s value silently if it was changed - It is against the rule of Validation fun to mutate form control
    // since this block mutates form control, this rule is violated, hence commented out. To handle auto-trim in the target template.
    // if (trimmed !== control.value) {
    //   control.setValue(trimmed, { emitEvent: false });
    // }
    
    if (!control.value) return null;

    const value = control.value as string;

    // Just check for whitespace — do not mutate the control
    const hasWhitespace = /\s/.test(value.trim());

    return hasWhitespace ? { hasWhiteSpace: true } : null;
  
  }
}
