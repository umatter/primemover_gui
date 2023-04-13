import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroiconClipboardDocumentComponent } from './heroicon-clipboard-document.component';

describe('HeroiconClipboardDocumentComponent', () => {
  let component: HeroiconClipboardDocumentComponent;
  let fixture: ComponentFixture<HeroiconClipboardDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeroiconClipboardDocumentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeroiconClipboardDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
