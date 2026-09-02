import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { fadeIn } from '@shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ExperimentService } from '@app/entity/service';
import { Experiment } from '../model/experiment';
import { Runner } from '../model/runner';
import { ExperimentApiService } from '../service/experiment-api.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ButtonComponent } from '@shared/form/button/button.component';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-experiment-create',
  templateUrl: './experiment-create.component.html',
  animations: [fadeIn],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatAutocompleteModule,
    ButtonComponent,
    NgForOf,
    AsyncPipe,
    NgIf,
    NgClass,
    RouterLink
  ],
  standalone: true
})
export class ExperimentCreateComponent implements OnInit, OnDestroy {
  experimentForm: FormGroup;
  subscriptions = new Subscription();
  experimentAutocomplete = new FormControl('', [Validators.required]);
  entities$: Observable<Experiment[]>;
  filteredEntities$: Observable<Experiment[]>;
  isLoading$: Observable<boolean>;
  runners: Runner[] = [];

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    public router: Router,
    private entityService: ExperimentService,
    private experimentApi: ExperimentApiService
  ) {
    this.entities$ = this.entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.filteredEntities$ = this.entityService.filteredEntities$;
    this.experimentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      contact: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      // Which runner executes the study; preselected with the API's default once loaded.
      runner_user_id: [null]
    });
  }

  get name(): FormControl | any {
    return this.experimentForm.get('name');
  }

  get contact(): FormControl | any {
    return this.experimentForm.get('contact');
  }

  get description(): FormControl | any {
    return this.experimentForm.get('description');
  }

  get runnerUserId(): FormControl | any {
    return this.experimentForm.get('runner_user_id');
  }

  ngOnInit(): void {
    this.entityService.getAll();
    this.subscriptions.add(
      this.experimentApi.runners().subscribe((runners) => {
        this.runners = runners;
        if (this.runnerUserId.value === null) {
          this.runnerUserId.setValue(runners.find((r) => r.is_default)?.id ?? null);
        }
      })
    );

    this.subscriptions.add(
      this.experimentAutocomplete.valueChanges.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((search) => {
        this.entityService.setFilter(search);
        this.name.setValue(search);
      })
    );
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.experimentForm.get(controlName)?.touched &&
      this.experimentForm.get(controlName)?.invalid &&
      this.experimentForm.get(controlName)?.getError(errorName)
    );
  }

  autoCompleteHasError(errorName: string) {
    return (
      this.experimentAutocomplete?.touched &&
      this.experimentAutocomplete?.invalid &&
      this.experimentAutocomplete.getError(errorName)
    );
  }

  setSelectedExperimentValues(item: any) {
    this.experimentForm.patchValue({
      name: item.name,
      contact: item.contact,
      description: item.description,
      runner_user_id: item.runner_user_id ?? this.runners.find((r) => r.is_default)?.id ?? null
    });
  }

  reset() {
    this.experimentForm.reset();
    this.experimentAutocomplete.setValue(null);
  }

  saveExperiment(): void {
    this.entityService.add(this.experimentForm.value).subscribe(() => this.router.navigate(['/experiments']));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
