import { Routes } from '@angular/router';
import { FlowsListComponent } from './flows/flows-list/flows-list.component';

export const routes: Routes = [
  {
    path: 'flows',
    children: [
      {
        path: 'list',
        component: FlowsListComponent
      },
      {
        path: 'create',
        component: FlowsListComponent // TODO: replace with CreateFlowComponent
      },
      {
        path: 'edit/:id',
        component: FlowsListComponent // TODO: replace with EditFlowComponent
      }
    ]
  },
  {
    path: '',
    redirectTo: '/flows/list',
    pathMatch: 'full'
  }
];
