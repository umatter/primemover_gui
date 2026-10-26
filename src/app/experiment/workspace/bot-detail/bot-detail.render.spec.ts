import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';

import { BotDetailComponent } from './bot-detail.component';
import { CrawlerService, QueueService } from '@app/entity/service';
import { VisibilityService } from '@shared/service/visibility.service';

/**
 * R2.4 (docs/specs/gui-finalisation.md): the ids came from inside the `bot$` pipeline, which
 * first runs when the template's async pipe subscribes, after the back link has rendered,
 * so dev mode threw NG0100 on every visit. The other bot-detail specs pre-set experimentId,
 * which hid it; this one takes the ids from the route only.
 */
describe('BotDetailComponent (R2.4 — renders from its route)', () => {
  it('renders without NG0100, the back link pointing at the experiment from the start', async () => {
    await TestBed.configureTestingModule({
      imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { getByKey: () => of({ id: 18, name: 'Red' }) } },
        {
          provide: QueueService,
          useValue: {
            entities$: of([]),
            loading$: of(false),
            getWithQuery: () => {},
            clearCache: () => {},
            cancel: () => {},
            errors$: EMPTY
          }
        },
        { provide: VisibilityService, useValue: { visible$: of(true) } },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: (k: string) => (k === 'id' ? '32' : '18') }) } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(BotDetailComponent);

    // detectChanges() runs the dev-mode checkNoChanges pass, which is what throws NG0100.
    expect(() => fixture.detectChanges()).not.toThrow();
    const back: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href^="/experiments"]');
    expect(back.getAttribute('href')).toBe('/experiments/32');
  });
});
