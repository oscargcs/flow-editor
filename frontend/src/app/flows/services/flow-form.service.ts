import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormControl, FormRecord, ValidatorFn, Validators } from '@angular/forms';
import { forkJoin, map, Observable, of } from 'rxjs';
import { Flow, FlowComponent } from '../types/flow.model';
import { FlowFormFieldName, FlowFormGroup } from '../types/flow-form.types';
import { CreateFlowRequest, UpdateFlowRequest } from '../types/flow-requests';
import { ComponentConfigFormRecord, ComponentConfigPanel } from '../types/component-config-panel';
import { ComponentConfigurationField } from '../types/component-configuration-field';
import { ComponentDefinitionsService, ComponentOption } from './component-definitions.service';

const BOOLEAN_FIELD_TYPE = 'boolean';

/**
 * Owns the reactive form used to create and edit a flow, plus the logic to
 * patch it from an existing 'Flow' and to build the create/update requests.
 * Also owns the dynamic configuration panels (fields + form) for the
 * currently selected consumer, producer, and services.
 */
@Injectable()
export class FlowFormService {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly componentDefinitionsService: ComponentDefinitionsService = inject(ComponentDefinitionsService);

  readonly form: FlowFormGroup = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)]),
    consumer: this.fb.nonNullable.control('', [Validators.required]),
    services: this.fb.nonNullable.control<string[]>([]),
    producer: this.fb.nonNullable.control('', [Validators.required]),
  });

  readonly consumerPanel: WritableSignal<ComponentConfigPanel | null> = signal(null);
  readonly producerPanel: WritableSignal<ComponentConfigPanel | null> = signal(null);
  readonly servicePanels: WritableSignal<ComponentConfigPanel[]> = signal([]);

  /**
   * Every panel ever built during this session, keyed by componentId.
   * A component's fields/options never change during a session, so once its
   * panel is built (fields fetched + form created) it's reused for the rest
   * of the session. This both avoids redundant backend calls and preserves
   * the user's entered values across selection/deselection cycles, since the
   * same FormRecord instance is reused instead of being rebuilt.
   */
  private readonly panelCache: Map<string, ComponentConfigPanel> = new Map();

  isFieldInvalid(fieldName: FlowFormFieldName): boolean {
    const control: FormControl = this.form.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  /** Checks whether the top-level form and every selected configuration panel's form are valid. */
  isValid(): boolean {
    console.log(this.form)
    return this.form.valid && this.getSelectedPanels().every((panel: ComponentConfigPanel) => panel.form.valid);
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
    this.getSelectedPanels().forEach((panel: ComponentConfigPanel) => panel.form.markAllAsTouched());
  }

  /** Returns all selected configuration panels. */
  private getSelectedPanels(): ComponentConfigPanel[] {
    const servicePanels: ComponentConfigPanel[] = [...this.servicePanels()];
    const consumerPanels: ComponentConfigPanel | null = this.consumerPanel();
    const producerPanels: ComponentConfigPanel | null = this.producerPanel();
    if (consumerPanels) servicePanels.push(consumerPanels);
    if (producerPanels) servicePanels.push(producerPanels);
    return servicePanels;
  }

  patchFromFlow(flow: Flow): void {
    this.form.patchValue({
      name: flow.name,
      consumer: flow.consumer?.id ?? '',
      services: flow.services?.map((service: FlowComponent): string => service.id) ?? [],
      producer: flow.producer?.id ?? '',
    });
  }

  /** Resolve the consumer's configuration panel (from cache or backend) and set it as active. Clears the panel when componentId is empty. */
  loadConsumerConfig(componentId: string, label: string, initialConfig?: Record<string, unknown>): void {
    if (!componentId) {
      this.consumerPanel.set(null);
      return;
    }

    this.resolvePanel$(componentId, label, initialConfig).subscribe({
      next: (panel: ComponentConfigPanel) => this.consumerPanel.set(panel),
      error: (error: unknown) => console.error('Error loading consumer configuration', error),
    });
  }

  /** Resolve the producer's configuration panel (from cache or backend) and set it as active. Clears the panel when componentId is empty. */
  loadProducerConfig(componentId: string, label: string, initialConfig?: Record<string, unknown>): void {
    if (!componentId) {
      this.producerPanel.set(null);
      return;
    }

    this.resolvePanel$(componentId, label, initialConfig).subscribe({
      next: (panel: ComponentConfigPanel) => this.producerPanel.set(panel),
      error: (error: unknown) => console.error('Error loading producer configuration', error),
    });
  }

  /**
   * Keep the service configuration panels in sync with the currently selected services.
   * Reuses cached panels (preserving their form state across a deselect/reselect cycle)
   * and only fetches fields for services that have never been loaded before.
   * The resulting panel order always matches the selection order.
   */
  syncServicePanels(selected: ComponentOption[], initialConfigs?: Map<string, Record<string, unknown>>): void {
    if (selected.length === 0) {
      this.servicePanels.set([]);
      return;
    }

    const panels$: Observable<ComponentConfigPanel>[] = selected.map(
      (option: ComponentOption): Observable<ComponentConfigPanel> =>
        this.resolvePanel$(option.id, option.label, initialConfigs?.get(option.id)),
    );

    forkJoin(panels$).subscribe({
      next: (panels: ComponentConfigPanel[]) => this.servicePanels.set(panels),
      error: (error: unknown): void => console.error('Error loading service configuration', error),
    });
  }

  /** Return the cached panel for a component, or fetch its fields and build/cache it if this is the first time it's selected in this session. */
  private resolvePanel$(componentId: string, label: string, initialConfig?: Record<string, unknown>): Observable<ComponentConfigPanel> {
    const cached: ComponentConfigPanel | undefined = this.panelCache.get(componentId);
    if (cached) return of(cached);

    return this.componentDefinitionsService.getConfiguration(componentId).pipe(
      map((fields: ComponentConfigurationField[]) => {
        const panel: ComponentConfigPanel = this.buildPanel(componentId, label, fields, initialConfig);
        this.panelCache.set(componentId, panel);
        return panel;
      }),
    );
  }

  buildCreateRequest(): CreateFlowRequest {
    return {
      name: this.form.controls.name.value,
      consumer: this.toFlowComponent(this.form.controls.consumer.value, this.consumerPanel()),
      services: this.form.controls.services.value.map(
        (serviceId: string): FlowComponent => this.toServiceFlowComponent(serviceId),
      ),
      producer: this.toFlowComponent(this.form.controls.producer.value, this.producerPanel()),
    };
  }

  buildUpdateRequest(): UpdateFlowRequest {
    return this.buildCreateRequest();
  }

  private toFlowComponent(componentId: string, panel: ComponentConfigPanel | null): FlowComponent {
    return {
      id: componentId,
      config: panel && panel.componentId === componentId ? panel.form.getRawValue() : {},
    };
  }

  private toServiceFlowComponent(componentId: string): FlowComponent {
    const panel: ComponentConfigPanel | undefined = this.servicePanels().find(
      (candidate: ComponentConfigPanel): boolean => candidate.componentId === componentId,
    );
    return {
      id: componentId,
      config: panel ? panel.form.getRawValue() : {},
    };
  }

  private buildPanel(
    componentId: string,
    label: string,
    fields: ComponentConfigurationField[],
    initialConfig?: Record<string, unknown>,
  ): ComponentConfigPanel {
    const form: ComponentConfigFormRecord = new FormRecord<FormControl<string | boolean>>({});

    fields.forEach((field: ComponentConfigurationField): void => {
      const validators: ValidatorFn[] = field.required ? [Validators.required] : [];
      form.addControl(
        field.id,
        new FormControl<string | boolean>(this.resolveInitialValue(field, initialConfig), { nonNullable: true, validators }),
      );
    });

    return { componentId, label, fields, form };
  }

  private resolveInitialValue(field: ComponentConfigurationField, initialConfig?: Record<string, unknown>): string | boolean {
    const rawValue: unknown = initialConfig?.[field.id];

    if (field.type === BOOLEAN_FIELD_TYPE) {
      if (typeof rawValue === 'boolean') return rawValue;
      if (typeof field.defaultValue === 'boolean') return field.defaultValue;
      return field.defaultValue === 'true';
    }

    if (rawValue !== undefined && rawValue !== null) return String(rawValue);
    return field.defaultValue != null ? String(field.defaultValue) : '';
  }
}
