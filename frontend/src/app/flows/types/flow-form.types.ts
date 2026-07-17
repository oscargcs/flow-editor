import {FormControl, FormGroup} from '@angular/forms';

export interface FlowFormControls {
  name: FormControl<string>;
  consumer: FormControl<string>;
  services: FormControl<string[]>;
  producer: FormControl<string>;
}

export type FlowFormGroup = FormGroup<FlowFormControls>;

export type FlowFormFieldName = keyof FlowFormControls;
