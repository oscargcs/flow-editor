import { FormControl, FormRecord } from '@angular/forms';
import { ComponentConfigurationField } from './component-configuration-field';

/** Dynamic set of controls, one per configuration field id. Values are either a checkbox boolean or a text input string. */
export type ComponentConfigFormRecord = FormRecord<FormControl<string | boolean>>;

/** A selected component (consumer, producer, or one service) together with its configuration fields and form. */
export interface ComponentConfigPanel {
  componentId: string;
  label: string;
  fields: ComponentConfigurationField[];
  form: ComponentConfigFormRecord;
}

