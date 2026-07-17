/** A single configurable field for a component, as returned by the backend. */
export interface ComponentConfigurationField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  defaultValue: unknown;
  description: string;
}

