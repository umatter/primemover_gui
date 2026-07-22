import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ReplaySubject } from 'rxjs';
import {
  DefaultDataServiceConfig,
  EntityCollectionReducerMethodsFactory,
  EntityDataModule,
  HttpUrlGenerator,
  PersistenceResultHandler
} from '@ngrx/data';
import { of } from 'rxjs';

import { RunComposerComponent } from './run-composer.component';
import { entityConfig, defaultDataServiceConfig } from '@app/entity/metadata';
import { CustomHttpUrlGenerator } from '@app/entity/custom-http-url.generator';
import { AdditionalPersistenceResultHandler } from '@app/entity/persistence.handler';
import { AdditionalEntityCollectionReducerMethodsFactory } from '@app/entity/reducer.methods';
import { AppConfig } from '@app/app-config';

/**
 * Integration test: runs the add-job flow through the REAL @ngrx/data store (custom persistence
 * handler + reducer + url generator) with an HTTP mock, to reproduce "job created but doesn't
 * show in the sequence".
 */
describe('RunComposerComponent (integration — add job then render)', () => {
  let fixture: ComponentFixture<RunComposerComponent>;
  let component: RunComposerComponent;
  let http: HttpTestingController;
  let paramMap$: ReplaySubject<any>;

  const flush = (method: string, urlIncludes: string, body: any) => {
    const reqs = http.match((r) => r.method === method && r.url.includes(urlIncludes));
    reqs.forEach((r: TestRequest) => r.flush(body));
    return reqs.length;
  };

  beforeEach(async () => {
    paramMap$ = new ReplaySubject<any>(1);
    await TestBed.configureTestingModule({
      imports: [
        RunComposerComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
        EntityDataModule.forRoot(entityConfig)
      ],
      providers: [
        provideRouter([]),
        { provide: HttpUrlGenerator, useClass: CustomHttpUrlGenerator },
        { provide: DefaultDataServiceConfig, useValue: defaultDataServiceConfig },
        { provide: PersistenceResultHandler, useClass: AdditionalPersistenceResultHandler },
        { provide: EntityCollectionReducerMethodsFactory, useClass: AdditionalEntityCollectionReducerMethodsFactory },
        { provide: AppConfig, useValue: { apiBaseUrl: 'http://localhost:8090/api/v1' } },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RunComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit + template subscribes run$ (no params yet → loadingTpl)
  });

  it('shows a newly added job in the sequence', fakeAsync(() => {
    // emit route params asynchronously (like the real router) → switchMap sets runId + loadJobs
    paramMap$.next({ get: (k: string) => (k === 'runId' ? '9' : '1') });
    tick();
    fixture.detectChanges();

    // initial loads: GET run + GET jobs (empty)
    flush('GET', '/queues/9', { data: { id: 9, name: 'Run' } });
    flush('GET', '/jobs/', { data: [] });
    tick();
    fixture.detectChanges();

    // add a visit job with a url
    component.addForm.patchValue({ type: 'visitjob' });
    component.onTypeChange();
    component.addForm.patchValue({ name: 'Open home' });
    component.fieldsForm.patchValue({ url: 'https://youtube.com' });
    component.addJob();
    tick();

    // POST /jobs → server returns the created job (with id + queue_id)
    const posted = flush('POST', '/jobs/', { data: { id: 100, name: 'Open home', type: 'visitjob', queue_id: 9, order: 1, active: 1 } });
    expect(posted).toBe(1);
    tick();

    // POST /behaviors (url + captchaMode) → each returns a behaviour
    flush('POST', '/behaviors/', { data: { id: 500, name: 'url', value: 'https://youtube.com', job_id: 100 } });
    tick();

    // reload after add: GET jobs now returns the job
    flush('GET', '/jobs/', { data: [{ id: 100, name: 'Open home', type: 'visitjob', queue_id: 9, order: 1, active: 1 }] });
    tick();
    fixture.detectChanges();

    expect(component.jobs.length).toBe(1);
    expect(component.jobs[0].id).toBe(100);
  }));

  it('submits a POST when the form is filled and the Add button is clicked (DOM)', fakeAsync(() => {
    paramMap$.next({ get: (k: string) => (k === 'runId' ? '9' : '1') });
    tick();
    fixture.detectChanges();
    flush('GET', '/queues/9', { data: { id: 9, name: 'Run' } });
    flush('GET', '/jobs/', { data: [] });
    tick();
    fixture.detectChanges();

    // pick a type (drives the dynamic fields), then type the url via the real input element
    component.addForm.patchValue({ type: 'visitjob' });
    component.onTypeChange();
    component.addForm.patchValue({ name: 'Open home' });
    fixture.detectChanges();

    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('#field-url');
    expect(urlInput).withContext('url input should render for visitjob').toBeTruthy();
    urlInput.value = 'https://youtube.com';
    urlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    // the typed value must reach the dynamic fieldsForm control
    expect(component.fieldsForm.get('url')?.value).toBe('https://youtube.com');

    // click the real submit button → must trigger addJob → POST
    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    submitBtn.click();
    tick();

    const posts = http.match((r) => r.method === 'POST' && r.url.includes('/jobs/'));
    expect(posts.length).withContext('clicking Add must POST a job').toBe(1);
    posts.forEach((r) => r.flush({ data: { id: 100, name: 'Open home', type: 'visitjob', queue_id: 9, order: 1, active: 1 } }));
    tick();
    flush('POST', '/behaviors/', { data: { id: 500, name: 'url', value: 'https://youtube.com', job_id: 100 } });
    tick();
    flush('GET', '/jobs/', { data: [{ id: 100, name: 'Open home', type: 'visitjob', queue_id: 9, order: 1, active: 1 }] });
    tick();
    fixture.detectChanges();
  }));

  afterEach(() => http.verify());
});
