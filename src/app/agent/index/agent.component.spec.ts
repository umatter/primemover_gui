import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentComponent } from './agent.component';

describe('AgentComponent', () => {
  let component: ComponentFixture<AgentComponent>['componentInstance'];
  let fixture: ComponentFixture<AgentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // standalone: imported, not declared
      imports: [AgentComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
