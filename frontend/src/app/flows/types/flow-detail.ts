import { ComponentConfigurationField } from './component-configuration-field';

/** A flow component enriched with its display label and configuration field definitions (already resolved by the backend). */
export interface FlowDetailComponent {
  id: string;
  label: string;
  config: Record<string, unknown>;
  fields: ComponentConfigurationField[];
}

/** Shape returned by GET /flow/:id, used to prefill the edit form in a single call. */
export interface FlowDetail {
  id: string;
  name: string;
  consumer: FlowDetailComponent;
  services: FlowDetailComponent[];
  producer: FlowDetailComponent;
}


