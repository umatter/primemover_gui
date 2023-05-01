import { Component, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BehaviorService, JobService } from '@app/entity/service';
import { filter, Observable, Subscription } from 'rxjs';
import { Behavior } from '@app/behavior/behavior';
import { ActivatedRoute } from '@angular/router';
import { BehaviorApiService } from '@app/behavior/service/behavior-api.service';
import { Store } from '@ngrx/store';
import { jobSelection, requestPage } from '@shared/store/shared.actions';
import { selectCurrentJob, selectQueryFilter } from '@shared/store/shared.selectors';
import { Meta } from '@shared/pagination/model';
import { PaginatePipeArgs } from 'ngx-pagination';
import { QueryFilter } from '@shared/model/query-filter';

@Component({
  selector: 'app-behavior',
  templateUrl: './behavior.component.html'
})
export class BehaviorComponent implements OnDestroy {
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Behavior[] | any>;
  isLoading$: Observable<boolean>;
  pageMeta$: Observable<Meta>;
  queryFilter$: Observable<QueryFilter[]>;
  entityToDelete: Behavior | null = null;
  subscriptions = new Subscription();
  behaviorModal: boolean;
  jobId: string | null;

  constructor(
    private fb: FormBuilder,
    private entityService: BehaviorService,
    private route: ActivatedRoute,
    private jobService: JobService,
    private behaviorApiService: BehaviorApiService,
    private store: Store
  ) {
    this.entities$ = this.entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.pageMeta$ = entityService.pageMeta$;
    this.queryFilter$ = this.store.select(selectQueryFilter);

    this.jobId = this.route.snapshot.paramMap.get('id');
    this.subscriptions.add(
      this.jobService
        .getByKey(this.jobId)
        .pipe()
        .subscribe((job) => (job ? this.store.dispatch(jobSelection({ job })) : null))
    );

    this.subscriptions.add(
      this.store
        .select(selectCurrentJob)
        .pipe(filter((job) => !!job))
        .subscribe(() => this.getData())
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.pageMeta$.pipe().subscribe((meta) => {
        this.paginationConfig = this.behaviorApiService.getPaginateArgs(meta);
      })
    );
  }

  getData(page: number = 1): void {
    this.store.dispatch(requestPage({ page }));

    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.behaviorApiService.getParams());
      })
    );
    this.initPagination();
  }

  // deleteRequested(item: Behavior) {
  //   this.entityService.delete(item.id);
  // }

  onBehaviorModalSave(behavior: Behavior) {
    this.entityService.clearCache();
    this.entityService.add({
      ...behavior,
      job_id: Number(this.jobId)
    });
    this.getData();
    this.behaviorModal = false;
  }

  onBehaviorModalCancel() {
    this.behaviorModal = false;
  }

  deleteRequested(behavior: Behavior): void {
    this.entityToDelete = behavior;
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete?.id) {
      this.entityService.delete(this.entityToDelete.id);
    }
    this.entityToDelete = null;
  }

  ngOnDestroy(): void {
    this.entityService.clearCache();
    this.subscriptions.unsubscribe();
  }
}
