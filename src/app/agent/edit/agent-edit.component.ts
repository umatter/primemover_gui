import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AgentService } from '@app/entity/service';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { Agent } from '@app/agent/model/agent';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-agent-edit',
  templateUrl: './agent-edit.component.html'
})
export class AgentEditComponent implements OnDestroy {
  agent$: Observable<Agent>;
  agent: Agent;
  subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private agentService: AgentService,
    private store: Store,
    private router: Router
  ) {
    agentService.getAll();
    let fetchFormData$ = combineLatest([this.route.paramMap, this.agentService.entities$]).subscribe(
      ([params, agents]) => {
        const id = Number(params.get('id'));

        const agent = agents.find((agent) => agent.id === id);
        if (agent) {
          this.agent = agent;
        }
      }
    );
    // this.route.params.subscribe((params) => {
    //   this.agent$ = agentService.getByKey(params['id']);
    // });
    //
    // this.subscriptions.add(
    //   this.agent$.subscribe((agent) => {
    //     this.store.dispatch(crawlerSelection({ crawler: agent.crawler }));
    //   })
    // );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSave(agent: Agent) {
    console.log(agent);
    this.agentService.update(this.agent).subscribe((agent) => {
      //this.router.navigate(['/agents']);
    });
  }
}
