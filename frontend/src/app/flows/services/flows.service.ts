import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flow, CreateFlowRequest, UpdateFlowRequest } from '../models/flow.model';

@Injectable({
  providedIn: 'root'
})
export class FlowsService {
  private apiUrl = 'http://localhost:3000/flow'; // ajusta el puerto/host según tu backend

  constructor(private http: HttpClient) {}

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
    return flows.filter(flow =>
      flow.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

