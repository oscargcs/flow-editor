import { Routes } from '@angular/router';
import { FlowsListComponent } from './flows/flows-list/flows-list.component';
import {FlowCreate} from './flows/flow-create/flow-create';

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
        component: FlowCreate // TODO: replace with CreateFlowComponent
      },
      {
        path: 'edit/:id',
        component: FlowCreate // TODO: replace with EditFlowComponent
      }
    ]
  },
  {
    path: '',
    redirectTo: '/flows/list',
    pathMatch: 'full'
  }
];
