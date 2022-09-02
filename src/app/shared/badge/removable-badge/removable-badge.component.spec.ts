import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemovableBadgeComponent } from './removable-badge.component';

describe('RemovableBadgeComponent', () => {
  let component: RemovableBadgeComponent;
  let fixture: ComponentFixture<RemovableBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RemovableBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RemovableBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
