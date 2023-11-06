import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, distinctUntilChanged, map, Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { Router } from '@angular/router';
import { fadeIn } from '@shared/animation/trigger';
import { Experiment } from '../model/experiment';
import { ExperimentService } from '@app/entity/service';
import { selectCurrentExperiment } from '@shared/store/shared.selectors';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { requiredFileType } from '@shared/file-upload/file.validator';
import { SharedActions } from '@shared/store/shared.actions';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadComponent } from '@shared/file-upload/file-upload.component';
import { selectError, selectIsLoading } from '@shared/store/shared.reducer';

@Component({
  selector: 'app-experiment-upload',
  templateUrl: './experiment-upload.component.html',
  animations: [fadeIn],
  imports: [
    NotificationComponent,
    LoadingSpinnerComponent,
    NgIf,
    AsyncPipe,
    TranslateModule,
    NgForOf,
    ReactiveFormsModule,
    FileUploadComponent
  ],
  standalone: true
})
export class ExperimentUploadComponent implements OnDestroy, OnInit {
  readonly apiDocsLink: string = 'https://pm-api.test.primemover.example/api/v1/docs';
  isLoading$: Observable<boolean>;
  currentExperiment$: Observable<Experiment>;
  subscriptions = new Subscription();
  uploadError$: Observable<any>;
  experiment: Experiment | null = null;
  experiments: Experiment[] = [];

  uploadForm = new FormGroup({
    experimentSelect: new FormControl(null, Validators.required),
    fileUpload: new FormControl(null, [Validators.required, requiredFileType('json')])
  });

  constructor(private store: Store, public router: Router, private entityService: ExperimentService) {
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
    this.uploadError$ = this.store.select(selectError);
    this.entityService
      .getAll()
      .pipe(distinctUntilChanged())
      .subscribe((experiments) => (this.experiments = experiments));

    this.initLoading(entityService.loading$, this.store.pipe(select(selectIsLoading)));
  }

  get fileUpload(): FormControl {
    return this.uploadForm.get('fileUpload') as FormControl;
  }

  get experimentSelect(): FormControl {
    return this.uploadForm.get('experimentSelect') as FormControl;
  }

  initLoading(...sources: Observable<boolean>[]): void {
    this.isLoading$ = combineLatest(sources).pipe(map((loadings) => loadings.some((loading) => loading)));
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.currentExperiment$
        .pipe(distinctUntilChanged())
        .subscribe((experiment) => this.experimentSelect.setValue(experiment?.id || ''))
    );

    this.subscriptions.add(
      this.experimentSelect.valueChanges.pipe().subscribe((id) => {
        const experiment = this.experiments.find((e) => e.id === Number(id));
        this.store.dispatch(SharedActions.experimentSelection({ experiment: experiment || null }));
      })
    );

    this.subscriptions.add(
      this.fileUpload.valueChanges.pipe().subscribe((file) => {
        this.store.dispatch(SharedActions.uploadExperimentRequested({ file: file }));
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
