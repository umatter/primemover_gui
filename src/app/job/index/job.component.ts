import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { PaginatePipeArgs } from 'ngx-pagination';
import { select, Store } from '@ngrx/store';
import { selectJobsPagination } from '../store/job.selectors';
import { JobService } from '@app/entity/service';
import { Job } from '@app/job/model/Job';
import { selectCurrentJob, selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { JobApiService } from '@app/job/service/job-api.service';
import { jobSelection } from '@shared/store/shared.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html'
})
export class JobComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Job[]>;
  entityToDelete: Job | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  currentJob$: Observable<Job>;

  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    private entityService: JobService,
    private apiService: JobApiService,
    private router: Router
  ) {
    this.entities$ = this.entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.queryFilter$ = this.store.select(selectQueryFilter);
    this.currentJob$ = this.store.select(selectCurrentJob);
    this.getData();
    //this.initPagination();
  }

  getData(page: number = 1): void {
    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectJobsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
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
