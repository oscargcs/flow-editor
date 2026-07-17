import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ComponentOption {
  id: string;
  label: string;
}

export interface GroupedComponentOptions {
  consumer: ComponentOption[];
  service: ComponentOption[];
  producer: ComponentOption[];
}

@Injectable({ providedIn: 'root' })
export class ComponentDefinitionsService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = 'http://localhost:3000/component-definitions';

  getAllOptions(): Observable<GroupedComponentOptions> {
    return this.http.get<GroupedComponentOptions>(`${this.apiUrl}/options`);
  }

  getConfiguration(componentId: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/configuration/${componentId}`);
  }
}
