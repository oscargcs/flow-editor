import { FormControl, FormGroup } from '@angular/forms';
import { ComponentConfigurationField } from './component-configuration-field';


export type ComponentFormGroup = FormGroup<{ id: FormControl<string> }>;

/** A selected component together with its configuration field definitions and its (nested) form group. */
export interface ComponentConfigPanel {
  componentId: string;
  label: string;
  fields: ComponentConfigurationField[];
  form: ComponentFormGroup;
}

