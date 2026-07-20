/** Lightweight component representation used in flow listings: just the display name. */
export interface FlowComponentSummary {
  name: string;
}

/** Shape returned by GET /flow (list view). */
export interface FlowSummary {
  id: string;
  name: string;
  consumer: FlowComponentSummary;
  services: FlowComponentSummary[];
  producer: FlowComponentSummary;
}

