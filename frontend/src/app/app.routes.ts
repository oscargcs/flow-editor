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
        component: FlowCreate
      },
      {
        path: 'edit/:id',
        component: FlowCreate
      }
    ]
  },
  {
    path: '',
    redirectTo: '/flows/list',
    pathMatch: 'full'
  }
];
