import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CrawlerService } from '@app/entity/service';
import { requiredFileType } from '@app/shared/file-upload/file.validator';
import { SharedActions } from '@app/shared/store/shared.actions';
import { selectCurrentCrawler, selectIsUploading, selectUploadError } from '@app/shared/store/shared.reducer';
import { select, Store } from '@ngrx/store';

import { fadeIn } from '@shared/animation/trigger';
import { combineLatest, distinctUntilChanged, map, Observable, Subscription } from 'rxjs';
import { Crawler } from '../model/crawler';

@Component({
  selector: 'app-crawler-upload',
  templateUrl: './crawler-upload.component.html',
  animations: [fadeIn]
})
export class CrawlerUploadComponent implements OnInit {
  readonly apiDocsLink: string = 'https://pm-api.test.primemover.example/api/v1/docs';
  isLoading$: Observable<boolean>;
  currentCrawler$: Observable<Crawler>;
  subscription = new Subscription();
  uploadError$: Observable<any>;
  crawler: Crawler | null = null;
  crawlers: Crawler[] = [];

  uploadForm = new FormGroup({
    crawlerSelect: new FormControl(null, Validators.required),
    fileUpload: new FormControl(null, [Validators.required, requiredFileType('json')])
  });

  constructor(private store: Store, public router: Router, private entityService: CrawlerService) {
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.uploadError$ = this.store.select(selectUploadError);
    this.entityService
      .getAll()
      .pipe(distinctUntilChanged())
      .subscribe((crawlers) => (this.crawlers = crawlers));

    this.initLoading(entityService.loading$, this.store.pipe(select(selectIsUploading)));
  }

  get fileUpload(): FormControl {
    return this.uploadForm.get('fileUpload') as FormControl;
  }

  get crawlerSelect(): FormControl {
    return this.uploadForm.get('crawlerSelect') as FormControl;
  }

  initLoading(...sources: Observable<boolean>[]): void {
    this.isLoading$ = combineLatest(sources).pipe(map((loadings) => loadings.some((loading) => loading)));
  }

  ngOnInit(): void {
    this.subscription.add(
      this.currentCrawler$
        .pipe(distinctUntilChanged())
        .subscribe((crawler) => this.crawlerSelect.setValue(crawler?.id || ''))
    );

    this.subscription.add(
      this.crawlerSelect.valueChanges.pipe().subscribe((id) => {
        const crawler = this.crawlers.find((e) => e.id === Number(id));
        this.store.dispatch(SharedActions.crawlerSelection({ crawler: crawler || null }));
      })
    );

    this.subscription.add(
      this.fileUpload.valueChanges.pipe().subscribe((file) => {
        this.store.dispatch(SharedActions.uploadFileCrawler({ file: file }));
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
