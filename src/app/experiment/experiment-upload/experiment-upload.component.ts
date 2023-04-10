import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, distinctUntilChanged, first, map, Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { Router } from '@angular/router';
import { fadeIn } from '@shared/animation/trigger';
import { Experiment } from '../model/experiment';
import { ExperimentService } from '@app/entity/service';
import { experimentSelection, uploadFile } from '@shared/store/shared.actions';
import { selectCurrentExperiment, selectIsUploading, selectUploadingError } from '@shared/store/shared.selectors';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-experiment-upload',
  templateUrl: './experiment-upload.component.html',
  animations: [fadeIn]
})
export class ExperimentUploadComponent implements OnDestroy, OnInit {
  isLoading$: Observable<boolean>;
  currentExperiment$: Observable<Experiment>;
  subscriptions = new Subscription();
  uploadError$: Observable<any>;
  experiment: Experiment | null = null;
  experiments: Experiment[] = [];
  experimentSelect: FormControl<number | any> = new FormControl([null, Validators.required]);
  fileUpload: FormControl<any> = new FormControl();

  constructor(private store: Store, public router: Router, private entityService: ExperimentService) {
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
    this.uploadError$ = this.store.select(selectUploadingError);
    this.entityService
      .getAll()
      .pipe(distinctUntilChanged())
      .subscribe((experiments) => (this.experiments = experiments));

    this.initLoading(entityService.loading$, this.store.pipe(select(selectIsUploading)));
  }

  get uploadedFile(): File | null {
    return this.fileUpload.value;
  }

  upload(event: any): void {
    console.log(this.uploadedFile);
    this.store.dispatch(uploadFile({ file: <File>event.target.files[0] }));
    this.fileUpload.reset();
  }

  initLoading(...sources: Observable<boolean>[]): void {
    this.isLoading$ = combineLatest(sources).pipe(map((loadings) => loadings.some((loading) => loading)));
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.currentExperiment$
        .pipe(distinctUntilChanged(), first())
        .subscribe((experiment) => this.experimentSelect.setValue(experiment?.id))
    );

    this.subscriptions.add(
      this.experimentSelect.valueChanges.pipe().subscribe((id) => {
        const experiment = this.experiments.find((e) => e.id === Number(id));
        this.store.dispatch(experimentSelection({ experiment: experiment || null }));
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
