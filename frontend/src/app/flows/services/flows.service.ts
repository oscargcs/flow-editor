import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Flow} from '../types/flow.model';
import {CreateFlowRequest, UpdateFlowRequest} from '../types/flow-requests';

@Injectable({
  providedIn: 'root'
})
export class FlowsService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = 'http://localhost:3000/flow';

  getFlows(): Observable<Flow[]> {
    return this.http.get<Flow[]>(this.apiUrl);
  }

  getFlow(id: string): Observable<Flow> {
    return this.http.get<Flow>(`${this.apiUrl}/${id}`);
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

  searchFlows(flows: Flow[], query: string): Flow[] {
    if (!query.trim()) return flows;
    const normalizedQuery: string = query.toLowerCase();
    return flows.filter((flow: Flow): boolean => flow.name.toLowerCase().includes(normalizedQuery));
  }
}
