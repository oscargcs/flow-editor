import { Component, input, InputSignal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ComponentConfigPanel } from '../types/component-config-panel';

const BOOLEAN_FIELD_TYPE = 'boolean';

/** Renders one component's configuration fields: a checkbox for booleans, a text input for everything else. */
@Component({
  selector: 'app-config-panel',
  imports: [ReactiveFormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './config-panel.component.html',
  styleUrl: './config-panel.component.scss',
})
export class ConfigPanelComponent {
  readonly panel: InputSignal<ComponentConfigPanel> = input.required<ComponentConfigPanel>();
  readonly booleanFieldType: string = BOOLEAN_FIELD_TYPE;

  isFieldInvalid(fieldId: string): boolean {
    const control: AbstractControl | null = this.panel().form.get(fieldId);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}


