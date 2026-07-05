import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FlowsService } from '../services/flows.service';
import {Flow, FlowComponent} from '../models/flow.model';

@Component({
  selector: 'app-flows-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flows-list.component.html',
  styleUrl: './flows-list.component.scss'
})
export class FlowsListComponent implements OnInit {
  // Señales
  flows = signal<Flow[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);

  // Computed signals
  filteredFlows = computed(() => {
    const allFlows = this.flows();
    return this.flowsService.searchFlows(allFlows, this.searchQuery());
  });

  constructor(
    private flowsService: FlowsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFlows();
  }

  private loadFlows(): void {
    this.isLoading.set(true);
    this.flowsService.getFlows().subscribe({
      next: (data) => {
        this.flows.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
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

  onDelete(flow: Flow): void {
    if (!confirm(`¿Would you really like to delete "${flow.name}"?`)) {
      return;
    }

    this.flowsService.deleteFlow(flow.id).subscribe({
      next: () => {
        this.loadFlows();
      },
      error: (err) => {
        console.error('Error deleting flow', err);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }


  getComponentName(flowComponent: FlowComponent): string {
    //TODO: Make it return a proper name
    return flowComponent?.id || 'Unknown';
  }

  getServicesNames(services: FlowComponent[]): string {
    if (!services || services.length === 0) return '-';
    return services.map(s => this.getComponentName(s)).join(', ');
  }
}






