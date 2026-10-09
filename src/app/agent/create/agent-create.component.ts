import { Component, OnDestroy } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Agent } from '@app/agent/model/agent';
import { AgentFormComponent } from '@app/agent/form/agent-form.component';
import { AgentService } from '@app/entity/service';

/**
 * F6 — create a browser identity (docs/specs/gui-finalisation.md). The form is the edit
 * form; until now it was reachable only behind `:id/edit`, so an empty Library could not
 * be filled from the GUI.
 */
@Component({
  selector: 'app-agent-create',
  standalone: true,
  imports: [AgentFormComponent, NgIf, RouterLink, TranslateModule],
  templateUrl: './agent-create.component.html'
})
export class AgentCreateComponent implements OnDestroy {
  error = false;
  private subscriptions = new Subscription();

  constructor(
    private agentService: AgentService,
    private router: Router
  ) {}

  onSave(agent: Agent): void {
    // The form carries an `id` control for edit mode; a create must not send it.
    const { id: _id, ...fields } = agent as Agent & { id?: number };
    this.error = false;
    this.subscriptions.add(
      this.agentService.add(fields as Agent).subscribe({
        next: () => this.router.navigate(['/agents']),
        error: () => (this.error = true)
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
