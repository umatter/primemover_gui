import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkSortableComponent } from './link-sortable.component';

describe('LinkSortableComponent', () => {
  let component: LinkSortableComponent;
  let fixture: ComponentFixture<LinkSortableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LinkSortableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LinkSortableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
