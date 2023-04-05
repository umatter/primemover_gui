import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Store } from '@ngrx/store';
import { JobService } from '@app/entity/service';
import { Job } from '@app/job/model/Job';
import { selectCurrentJob, selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { JobApiService } from '@app/job/service/job-api.service';
import { jobSelection, requestPage } from '@shared/store/shared.actions';
import { Router } from '@angular/router';
import { Meta } from '@shared/pagination/model';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html'
})
export class JobComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Job[] | any>;
  entityToDelete: Job | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  currentJob$: Observable<Job>;
  pageMeta$: Observable<Meta>;

  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    private entityService: JobService,
    private apiService: JobApiService,
    private router: Router
  ) {
    this.pageMeta$ = this.entityService.pageMeta$;
    this.entities$ = this.entityService.entities$;
    this.isLoading$ = this.entityService.loading$;

    this.queryFilter$ = this.store.select(selectQueryFilter);
    this.currentJob$ = this.store.select(selectCurrentJob);
    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(requestPage({ page }));
    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.pageMeta$.pipe().subscribe((meta) => {
        this.paginationConfig = this.apiService.getPaginateArgs(meta);
      })
    );
  }

  deleteRequested(job: Job): void {
    this.entityToDelete = job;
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete) {
      this.entityService.delete(this.entityToDelete.id);
    }
    this.entityToDelete = null;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  selectJob(item: Job) {
    this.store.dispatch(jobSelection({ job: item }));
    this.router.navigate(['/jobs', 'behaviors', item.id]).then();
  }
}
