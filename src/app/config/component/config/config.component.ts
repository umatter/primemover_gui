import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '../../../shared/animation/trigger';
import {
  configurationDeleteRequested,
  configurationPageRequested,
  configurationRequested
} from '../../store/config.actions';
import {
  selectConfigurationsListData,
  selectConfigurationsPagination,
  selectIsLoading
} from '../../store/config.selectors';
import { Configuration } from '../../model/config';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationPrimeoverDialogComponent } from 'src/app/shared/dialog/primeover-dialog/confirmation-primeover-dialog.component';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  animations: [fadeIn]
})
export class ConfigComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  configurationsData$: Observable<any>;
  isLoading$: Observable<boolean>;

  constructor(
    private store: Store,
    public router: Router,
    private matDialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.configurationsData$ = this.store.pipe(select(selectConfigurationsListData));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(configurationPageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectConfigurationsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectConfiguration(configuration: Configuration): void {
    this.store.dispatch(configurationRequested({ configuration: configuration }));
    // TODO move redirect to effects
    this.router.navigate(['crawlers']).then();
  }

  deleteConfiguration(configuration: any): void {
    const confirmationDialog = this.matDialog.open(ConfirmationPrimeoverDialogComponent, {
      data: {
        title: configuration.name,
        description: this.translate.instant('confirmation-delete.experiment.experimentDeleteMSG', {
          experimentName: configuration.name,
          experiment: 'configuration'
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
        const configurationId = configuration.id;
        this.store.dispatch(configurationDeleteRequested({ configurationId }));
        confirmationDialog.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
