import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { forkJoin, map, Observable, of } from 'rxjs';
import { FlowComponent } from '../types/flow.model';
import { FlowDetail, FlowDetailComponent } from '../types/flow-detail';
import { FlowFormFieldName, FlowFormGroup } from '../types/flow-form.types';
import { CreateFlowRequest, UpdateFlowRequest } from '../types/flow-requests';
import { ComponentConfigPanel, ComponentFormGroup } from '../types/component-config-panel';
import { ComponentConfigurationField } from '../types/component-configuration-field';
import { ComponentDefinitionsService, ComponentOption } from './component-definitions.service';

const BOOLEAN_FIELD_TYPE = 'boolean';

/**
 * Owns the single reactive form used to create and edit a flow. `consumer` and `producer`
 * are nested groups (`{ id, ...configFields }`) and `services` is a FormArray of the same
 * shape — there is only one root FormGroup (`form`) for the whole page, so validity and
 * touched-state simply delegate to it.
 */
@Injectable()
export class FlowFormService {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly componentDefinitionsService: ComponentDefinitionsService = inject(ComponentDefinitionsService);

  readonly form: FlowFormGroup = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)]),
    consumer: this.buildEmptyComponentGroup([Validators.required]),
    producer: this.buildEmptyComponentGroup([Validators.required]),
    services: this.fb.array<ComponentFormGroup>([]),
  });

  /** Metadata (label + field definitions) for the currently mounted consumer/producer/service panels, used to render <app-config-panel>. */
  readonly consumerPanel: WritableSignal<ComponentConfigPanel | null> = signal(null);
  readonly producerPanel: WritableSignal<ComponentConfigPanel | null> = signal(null);
  readonly servicePanels: WritableSignal<ComponentConfigPanel[]> = signal([]);

  /**
   * Every panel ever built during this session, keyed by componentId.
   * A component's fields never change during a session, so once its panel is
   * built (fields fetched + form created) it's reused for the rest of the
   * session. This both avoids redundant backend calls and preserves the
   * user's entered values across selection/deselection cycles, since the
   * same form group instance is reused instead of being rebuilt.
   */
  private readonly panelCache: Map<string, ComponentConfigPanel> = new Map();

  /** Checks whether a top-level field is invalid and has been interacted with (dirty/touched). `consumer`/`producer` are nested groups, so their `id` control is checked instead. */
  isFieldInvalid(fieldName: FlowFormFieldName): boolean {
    const control: AbstractControl =
      fieldName === 'consumer' || fieldName === 'producer'
        ? this.form.controls[fieldName].controls.id
        : this.form.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  /** The whole form (name + consumer + producer + services, all nested inside it) is valid on its own — no manual aggregation needed. */
  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  patchFromFlow(flow: FlowDetail): void {
    this.form.patchValue({ name: flow.name });
  }

  /** Resolve the consumer's configuration panel (from cache or backend) and mount it into the form. Resets to an empty group when componentId is empty. */
  loadConsumerConfig(componentId: string, label: string, initialConfig?: Record<string, unknown>): void {
    if (!componentId) {
      this.consumerPanel.set(null);
      this.form.setControl('consumer', this.buildEmptyComponentGroup([Validators.required]), { emitEvent: false });
      return;
    }

    this.resolvePanel$(componentId, label, initialConfig).subscribe({
      next: (panel: ComponentConfigPanel): void => {
        this.consumerPanel.set(panel);
        this.form.setControl('consumer', panel.form, { emitEvent: false });
      },
      error: (error: unknown): void => console.error('Error loading consumer configuration', error),
    });
  }

  /** Resolve the producer's configuration panel (from cache or backend) and mount it into the form. Resets to an empty group when componentId is empty. */
  loadProducerConfig(componentId: string, label: string, initialConfig?: Record<string, unknown>): void {
    if (!componentId) {
      this.producerPanel.set(null);
      this.form.setControl('producer', this.buildEmptyComponentGroup([Validators.required]), { emitEvent: false });
      return;
    }

    this.resolvePanel$(componentId, label, initialConfig).subscribe({
      next: (panel: ComponentConfigPanel): void => {
        this.producerPanel.set(panel);
        this.form.setControl('producer', panel.form, { emitEvent: false });
      },
      error: (error: unknown): void => console.error('Error loading producer configuration', error),
    });
  }

  /**
   * Keep the service configuration panels (and the `services` FormArray) in sync with the
   * currently selected services. Reuses cached panels (preserving their form state across a
   * deselect/reselect cycle) and only fetches fields for services never loaded before.
   * The resulting panel order always matches the selection order.
   */
  syncServicePanels(selected: ComponentOption[], initialConfigs?: Map<string, Record<string, unknown>>): void {
    if (selected.length === 0) {
      this.servicePanels.set([]);
      this.form.controls.services.clear();
      return;
    }

    const panels$: Observable<ComponentConfigPanel>[] = selected.map(
      (option: ComponentOption): Observable<ComponentConfigPanel> =>
        this.resolvePanel$(option.id, option.label, initialConfigs?.get(option.id)),
    );

    forkJoin(panels$).subscribe({
      next: (panels: ComponentConfigPanel[]): void => {
        this.servicePanels.set(panels);
        this.mountServicePanels(panels);
      },
      error: (error: unknown): void => console.error('Error loading service configuration', error),
    });
  }

  /**
   * Prime the consumer/producer/service panels directly from a FlowDetail, whose
   * components already carry their label + resolved field definitions + saved
   * config (as returned by GET /flow/:id). This avoids the extra per-component
   * HTTP calls that `loadConsumerConfig`/`loadProducerConfig`/`syncServicePanels`
   * would otherwise trigger, since everything needed to render the panels is
   * already there.
   */
  primeFromFlowDetail(flow: FlowDetail): void {
    const consumerPanel: ComponentConfigPanel | null = flow.consumer?.id ? this.primePanel(flow.consumer) : null;
    this.consumerPanel.set(consumerPanel);
    this.form.setControl(
      'consumer',
      consumerPanel?.form ?? this.buildEmptyComponentGroup([Validators.required]),
      { emitEvent: false },
    );

    const producerPanel: ComponentConfigPanel | null = flow.producer?.id ? this.primePanel(flow.producer) : null;
    this.producerPanel.set(producerPanel);
    this.form.setControl(
      'producer',
      producerPanel?.form ?? this.buildEmptyComponentGroup([Validators.required]),
      { emitEvent: false },
    );

    const servicePanels: ComponentConfigPanel[] = (flow.services ?? []).map(
      (service: FlowDetailComponent): ComponentConfigPanel => this.primePanel(service),
    );
    this.servicePanels.set(servicePanels);
    this.mountServicePanels(servicePanels);
  }

  /** Replace the `services` FormArray's contents with the given panels' (already-built) form groups, in order. */
  private mountServicePanels(panels: ComponentConfigPanel[]): void {
    const servicesArray: FormArray<ComponentFormGroup> = this.form.controls.services;
    servicesArray.clear({ emitEvent: false });
    panels.forEach((panel: ComponentConfigPanel): void => servicesArray.push(panel.form, { emitEvent: false }));
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

  /** Build (or reuse from cache) a panel from an already-known FlowDetailComponent, without any HTTP call. */
  private primePanel(component: FlowDetailComponent): ComponentConfigPanel {
    const cached: ComponentConfigPanel | undefined = this.panelCache.get(component.id);
    if (cached) return cached;

    const panel: ComponentConfigPanel = this.buildPanel(component.id, component.label, component.fields, component.config);
    this.panelCache.set(component.id, panel);
    return panel;
  }

  buildCreateRequest(): CreateFlowRequest {
    return {
      name: this.form.controls.name.value,
      consumer: this.toFlowComponent(this.consumerPanel()),
      services: this.servicePanels().map((panel: ComponentConfigPanel): FlowComponent => this.toFlowComponent(panel)),
      producer: this.toFlowComponent(this.producerPanel()),
    };
  }

  buildUpdateRequest(): UpdateFlowRequest {
    return this.buildCreateRequest();
  }

  private toFlowComponent(panel: ComponentConfigPanel | null): FlowComponent {
    if (!panel) return { id: '', config: {} };
    return { id: panel.componentId, config: this.extractConfig(panel.form) };
  }

  /** Every control in a component's form except `id` represents a configuration field value. */
  private extractConfig(form: ComponentFormGroup): Record<string, unknown> {
    const { id, ...config } = form.getRawValue() as Record<string, unknown>;
    return config;
  }

  private buildEmptyComponentGroup(validators: ValidatorFn[]): ComponentFormGroup {
    return this.fb.group({ id: this.fb.nonNullable.control('', validators) });
  }

  private buildPanel(
    componentId: string,
    label: string,
    fields: ComponentConfigurationField[],
    initialConfig?: Record<string, unknown>,
  ): ComponentConfigPanel {
    const form: ComponentFormGroup = this.fb.group({ id: this.fb.nonNullable.control(componentId) });

    fields.forEach((field: ComponentConfigurationField): void => {
      const validators: ValidatorFn[] = field.required ? [Validators.required] : [];
      // Cast needed: dynamic per-component fields can't be part of ComponentFormGroup's static type.
      (form as FormGroup).addControl(
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
