import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { fadeIn } from '@shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ExperimentService } from '@app/entity/service';
import { Experiment } from '../model/experiment';

@Component({
  selector: 'app-experiment-create',
  templateUrl: './experiment-create.component.html',
  animations: [fadeIn]
})
export class ExperimentCreateComponent implements OnInit, OnDestroy {
  experimentForm: FormGroup;
  subscriptions = new Subscription();
  experimentAutocomplete = new FormControl('', [Validators.required]);
  entities$: Observable<Experiment[]>;
  filteredEntities$: Observable<Experiment[]>;
  isLoading$: Observable<boolean>;

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    public router: Router,
    private entityService: ExperimentService
  ) {
    this.entities$ = this.entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.filteredEntities$ = this.entityService.filteredEntities$;
    this.experimentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      contact: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]]
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

  ngOnInit(): void {
    this.entityService.getAll();

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
    this.experimentForm.setValue({
      name: item.name,
      contact: item.contact,
      description: item.description
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
