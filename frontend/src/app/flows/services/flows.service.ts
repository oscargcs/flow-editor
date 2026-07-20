import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Flow} from '../types/flow.model';
import {FlowSummary} from '../types/flow-summary';
import {FlowDetail} from '../types/flow-detail';
import {CreateFlowRequest, UpdateFlowRequest} from '../types/flow-requests';

@Injectable({
  providedIn: 'root'
})
export class FlowsService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = 'http://localhost:3000/flow';

  getFlows(): Observable<FlowSummary[]> {
    return this.http.get<FlowSummary[]>(this.apiUrl);
  }

  getFlow(id: string): Observable<FlowDetail> {
    return this.http.get<FlowDetail>(`${this.apiUrl}/${id}`);
  }

  createFlow(request: CreateFlowRequest): Observable<Flow> {
    return this.http.post<Flow>(this.apiUrl, request);
  }

  updateFlow(id: string, request: UpdateFlowRequest): Observable<Flow> {
    return this.http.put<Flow>(`${this.apiUrl}/${id}`, request);
  }

  deleteFlow(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchFlows(flows: FlowSummary[], query: string): FlowSummary[] {
    if (!query.trim()) return flows;
    const normalizedQuery: string = query.toLowerCase();
    return flows.filter((flow: FlowSummary): boolean => flow.name.toLowerCase().includes(normalizedQuery));
  }
}
