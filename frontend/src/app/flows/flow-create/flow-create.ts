import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { FlowsService } from '../services/flows.service';
import {
  ComponentDefinitionsService,
  ComponentOption,
  GroupedComponentOptions,
} from '../services/component-definitions.service';
import { FlowDetail } from '../types/flow-detail';
import { FlowFormService } from '../services/flow-form.service';
import { FlowFormFieldName, FlowFormGroup } from '../types/flow-form.types';
import { ConfigPanelComponent } from '../config-panel/config-panel.component';

@Component({
  selector: 'app-flow-create',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ConfigPanelComponent,
  ],
  providers: [FlowFormService],
  templateUrl: './flow-create.html',
  styleUrl: './flow-create.scss',
})
export class FlowCreate {
  private readonly flowsService: FlowsService = inject(FlowsService);
  private readonly componentDefinitionsService: ComponentDefinitionsService = inject(ComponentDefinitionsService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  protected readonly formService: FlowFormService = inject(FlowFormService);

  readonly form: FlowFormGroup = this.formService.form;


  readonly isEditMode: WritableSignal<boolean> = signal(false);
  readonly isLoading: WritableSignal<boolean> = signal(false);
  readonly isSaving: WritableSignal<boolean> = signal(false);
  readonly selectedFlowId: WritableSignal<string> = signal('');
  readonly pageTitle: Signal<string> = computed((): string => (this.isEditMode() ? 'Edit flow' : 'Create flow'));

  readonly consumerOptions: WritableSignal<ComponentOption[]> = signal([]);
  readonly serviceOptions: WritableSignal<ComponentOption[]> = signal([]);
  readonly producerOptions: WritableSignal<ComponentOption[]> = signal([]);

  /** Ids of the currently selected services, derived from the mounted service panels (kept in selection order). */
  readonly serviceIds: Signal<string[]> = computed((): string[] =>
    this.formService.servicePanels().map((panel) => panel.componentId),
  );

  constructor() {
    this.loadOptions();

    const flowId: string | null = this.route.snapshot.paramMap.get('id');
    if (flowId) {
      this.isEditMode.set(true);
      this.selectedFlowId.set(flowId);
      this.loadFlow(flowId);
    }
  }

  onSave(): void {
    if (!this.formService.isValid() || this.isSaving()) {
      this.formService.markAllAsTouched();
      return;
    }

    const flowId: string = this.selectedFlowId();

    if (this.isEditMode() && flowId) {
      this.isSaving.set(true);
      this.flowsService.updateFlow(flowId, this.formService.buildUpdateRequest()).subscribe({
        next: (): void => {
          this.router.navigate(['/flows/list']);
        },
        error: (error: unknown): void => {
          console.error('Error saving flow', error);
          this.isSaving.set(false);
        },
        complete: (): void => this.isSaving.set(false),
      });
      return;
    }

    this.isSaving.set(true);
    this.flowsService.createFlow(this.formService.buildCreateRequest()).subscribe({
      next: (): void => {
        this.router.navigate(['/flows/list']);
      },
      error: (error: unknown): void => {
        console.error('Error saving flow', error);
        this.isSaving.set(false);
      },
      complete: (): void => this.isSaving.set(false),
    });
  }

  onCancel(): void {
    this.router.navigate(['/flows/list']);
  }

  onConsumerChange(event: MatSelectChange): void {
    const componentId: string = event.value;
    const label: string = this.findLabel(this.consumerOptions(), componentId);
    this.formService.loadConsumerConfig(componentId, label);
  }

  onProducerChange(event: MatSelectChange): void {
    const componentId: string = event.value;
    const label: string = this.findLabel(this.producerOptions(), componentId);
    this.formService.loadProducerConfig(componentId, label);
  }

  onServicesChange(event: MatSelectChange): void {
    const componentIds: string[] = event.value;
    const selected: ComponentOption[] = componentIds.map(
      (id: string): ComponentOption => ({ id, label: this.findLabel(this.serviceOptions(), id) }),
    );
    this.formService.syncServicePanels(selected);
  }

  isFieldInvalid(fieldName: FlowFormFieldName): boolean {
    return this.formService.isFieldInvalid(fieldName);
  }

  trackById(_index: number, item: ComponentOption): string {
    return item.id;
  }

  private findLabel(options: ComponentOption[], componentId: string): string {
    return options.find((option: ComponentOption): boolean => option.id === componentId)?.label ?? componentId;
  }

  private loadOptions(): void {
    this.componentDefinitionsService.getAllOptions().subscribe({
      next: (options: GroupedComponentOptions): void => {
        this.consumerOptions.set(options.consumer);
        this.serviceOptions.set(options.service);
        this.producerOptions.set(options.producer);
      },
      error: (error: unknown): void => console.error('Error loading component options', error),
    });
  }

  private loadFlow(flowId: string): void {
    this.isLoading.set(true);
    this.flowsService.getFlow(flowId).subscribe({
      next: (flow: FlowDetail): void => {
        this.formService.patchFromFlow(flow);
        this.formService.populateFromFlowDetail(flow);
        this.isLoading.set(false);
      },
      error: (error: unknown): void => {
        console.error('Error loading flow', error);
        this.isLoading.set(false);
      },
    });
  }
}

