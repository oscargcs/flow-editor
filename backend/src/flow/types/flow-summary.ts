/** Lightweight component representation used in flow listings: just the display name for now. */
export interface FlowComponentSummary {
  name: string;
  description: string;
}

/** Shape returned by GET /flow (list view). */
export interface FlowSummary {
  id: string;
  name: string;
  consumer: FlowComponentSummary;
  services: FlowComponentSummary[];
  producer: FlowComponentSummary;
}

