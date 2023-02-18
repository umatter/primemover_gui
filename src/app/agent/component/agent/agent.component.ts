import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '../../../shared/animation/trigger';
import { agentDeleteRequested, agentPageRequested, agentRequested, getAgetList } from '../../store/agent.actions';
import { agentsList, selectAgentsListData, selectAgentsPagination, selectIsLoading } from '../../store/agent.selectors';
import { Agent } from '../../model/agent';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationPrimeoverDialogComponent } from 'src/app/shared/dialog/primeover-dialog/confirmation-primeover-dialog.component';

@Component({
  selector: 'app-agent',
  templateUrl: './agent.component.html',
  animations: [fadeIn]
})
export class AgentComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  agentsData$: Observable<any>;
  agentListData$: Observable<any>;

  isLoading$: Observable<boolean>;

  constructor(
    private store: Store,
    public router: Router,
    private matDialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.agentsData$ = this.store.pipe(select(selectAgentsListData));
    this.store.dispatch(getAgetList());
    this.isLoading$ = this.store.pipe(select(selectIsLoading));
    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(agentPageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectAgentsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectAgent(agent: Agent): void {
    this.store.dispatch(agentRequested({ agent: agent }));
    // TODO move redirect to effects
    this.router.navigate(['crawlers']).then();
  }

  deleteAgent(agent: any): void {
    const confirmationDialog = this.matDialog.open(ConfirmationPrimeoverDialogComponent, {
      data: {
        title: agent.name,
        description: this.translate.instant('confirmation-delete.experiment.experimentDeleteMSG', {
          experimentName: agent.name,
          experiment: 'agent'
        }),
        otherButtonName: this.translate.instant('confirmation-delete.experiment.otherButton'),
        cancelButtonName: this.translate.instant('confirmation-delete.experiment.cancelButton')
      },
      width: '550px'
    });
    confirmationDialog.componentInstance.event.subscribe((eventType: string) => {
      if (eventType === 'cancel') {
        confirmationDialog.close();
      } else {
        const agentId = agent.id;
        this.store.dispatch(agentDeleteRequested({ agentId }));
        confirmationDialog.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
