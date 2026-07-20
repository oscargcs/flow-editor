import { Component, OnInit, signal, computed, inject, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FlowsService } from '../services/flows.service';
import {FlowComponentSummary, FlowSummary} from '../types/flow-summary';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-flows-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, MatButton],
  templateUrl: './flows-list.component.html',
  styleUrl: './flows-list.component.scss'
})
export class FlowsListComponent implements OnInit {
  private readonly flowsService: FlowsService = inject(FlowsService);
  private readonly router: Router = inject(Router);

  readonly flows: WritableSignal<FlowSummary[]> = signal([]);
  readonly searchQuery: WritableSignal<string> = signal('');
  readonly isLoading: WritableSignal<boolean> = signal(false);

  readonly filteredFlows: Signal<FlowSummary[]> = computed((): FlowSummary[] => {
    const allFlows: FlowSummary[] = this.flows();
    return this.flowsService.searchFlows(allFlows, this.searchQuery());
  });

  ngOnInit(): void {
    this.loadFlows();
  }

  private loadFlows(): void {
    this.isLoading.set(true);
    this.flowsService.getFlows().subscribe({
      next: (data: FlowSummary[]): void => {
        this.flows.set(data);
        this.isLoading.set(false);
      },
      error: (err: unknown): void => {
        console.error('Error loading flows', err);
        this.isLoading.set(false);
      }
    });
  }

  onCreate(): void {
    this.router.navigate(['/flows/create']);
  }

  onEdit(flowId: string): void {
    this.router.navigate(['/flows/edit', flowId]);
  }

  onDelete(flow: FlowSummary): void {
    if (!confirm(`¿Would you really like to delete "${flow.name}"?`)) {
      return;
    }

    this.flowsService.deleteFlow(flow.id).subscribe({
      next: (): void => {
        this.loadFlows();
      },
      error: (err: unknown): void => {
        console.error('Error deleting flow', err);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  getServicesNames(services: FlowComponentSummary[]): string {
    if (!services || services.length === 0) return '-';
    return services.map((service: FlowComponentSummary): string => service.name).join(', ');
  }

  getServicesTooltip(services: FlowComponentSummary[]): string {
    if (!services || services.length === 0) return '';
    return services
      .map((service: FlowComponentSummary): string => `${service.name}: ${service.description}`)
      .join('\n');
  }
}
