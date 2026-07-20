import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ComponentFormGroup } from './component-config-panel';

export interface FlowFormControls {
  name: FormControl<string>;
  consumer: ComponentFormGroup;
  producer: ComponentFormGroup;
  services: FormArray<ComponentFormGroup>;
}

export type FlowFormGroup = FormGroup<FlowFormControls>;

/** Fields that support "required and touched" validation. `services` has no such validation. */
export type FlowFormFieldName = 'name' | 'consumer' | 'producer';
