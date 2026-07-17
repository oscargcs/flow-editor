import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import {Flow,
  FlowComponent,
} from '../types/flow.model';
import {FlowFormFieldName, FlowFormGroup} from '../types/flow-form.types';
import {CreateFlowRequest, UpdateFlowRequest} from '../types/flow-requests';

/**
 * Owns the reactive form used to create and edit a flow, plus the logic to
 * patch it from an existing 'Flow' and to build the create/update requests.
 */
@Injectable()
export class FlowFormService {
  private readonly fb: FormBuilder = inject(FormBuilder);

  readonly form: FlowFormGroup = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)]),
    consumer: this.fb.nonNullable.control('', [Validators.required]),
    services: this.fb.nonNullable.control<string[]>([]),
    producer: this.fb.nonNullable.control('', [Validators.required]),
  });

  isFieldInvalid(fieldName: FlowFormFieldName): boolean {
    const control: FormControl = this.form.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  patchFromFlow(flow: Flow): void {
    this.form.patchValue({
      name: flow.name,
      consumer: flow.consumer?.id ?? '',
      services: flow.services?.map((service: FlowComponent): string => service.id) ?? [],
      producer: flow.producer?.id ?? '',
    });
  }

  buildCreateRequest(): CreateFlowRequest {
    return {
      name: this.form.controls.name.value,
      consumer: this.toFlowComponent(this.form.controls.consumer.value),
      services: this.form.controls.services.value.map(
        (serviceId: string): FlowComponent => this.toFlowComponent(serviceId),
      ),
      producer: this.toFlowComponent(this.form.controls.producer.value),
    };
  }

  buildUpdateRequest(): UpdateFlowRequest {
    return this.buildCreateRequest();
  }

  private toFlowComponent(componentId: string): FlowComponent {
    return {
      id: componentId,
      config: {},
    };
  }
}

