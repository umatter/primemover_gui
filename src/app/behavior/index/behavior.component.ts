import { Component, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BehaviorService, JobService } from '@app/entity/service';
import { filter, Observable, Subscription } from 'rxjs';
import { Behavior } from '@app/behavior/behavior';
import { ActivatedRoute } from '@angular/router';
import { BehaviorApiService } from '@app/behavior/service/behavior-api.service';
import { Store } from '@ngrx/store';
import { jobSelection } from '@shared/store/shared.actions';
import { Job } from '@app/job/model/Job';
import { selectCurrentJob } from '@shared/store/shared.selectors';

@Component({
  selector: 'app-behavior',
  templateUrl: './behavior.component.html'
})
export class BehaviorComponent implements OnDestroy {
  entities$: Observable<Behavior[]>;
  isLoading$: Observable<boolean>;
  currentJob$: Observable<Job>;
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

  getData(): void {
    this.entityService.getWithQuery(this.behaviorApiService.getParams());
  }

  deleteRequested(item: Behavior) {
    this.entityService.delete(item.id);
  }

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

  ngOnDestroy(): void {
    this.entityService.clearCache();
    this.subscriptions.unsubscribe();
  }
}
