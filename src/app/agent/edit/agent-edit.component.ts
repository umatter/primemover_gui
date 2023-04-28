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
  agent: Agent | undefined;
  subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private agentService: AgentService,
    private store: Store,
    private router: Router
  ) {
    agentService.getAll();
    this.findAgent();
  }

  findAgent(): void {
    combineLatest([this.route.paramMap, this.agentService.entities$]).subscribe(([params, agents]) => {
      this.agent = agents.find((agent) => agent.id === Number(params.get('id'))) ?? undefined;
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSave(agent: Agent) {
    this.agentService.update(agent);
    this.router.navigate(['/agents']).then();
  }
}
