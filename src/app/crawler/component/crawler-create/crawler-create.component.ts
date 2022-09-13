import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { agentRequest, completeCrawlerCreateRequested, configRequest, experimentRequest, proxyRequest, updateCrawlerCreateValues } from '../../store/crawler.actions';
import { CrawlerFormValues } from '../../model/crawler-form-values';
import { selectAgentsPagination } from 'src/app/agent/store/agent.selectors';
import { PaginatePipeArgs } from 'ngx-pagination';
import { MatDialog } from '@angular/material/dialog';
import { ConfigCreateComponent } from 'src/app/config/component/config-create/config-create.component';
import { AgentCreateComponent } from 'src/app/agent/component/agent-create/agent-create.component';
import { ProxyCreateComponent } from 'src/app/proxy/component/proxy-create/proxy-create.component';
import { ExperimentCreateComponent } from 'src/app/experiment/component/experiment-create/experiment-create.component';
import { agentList, configList, experimentList, proxyList } from '../../store/crawler.selectors';

@Component({
  selector: 'app-crawler-create',
  templateUrl: './crawler-create.component.html',
  animations: [fadeIn]
})
export class CrawlerCreateComponent implements OnInit, OnDestroy {
  crawlerForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  experiments: any;
  proxies: any;
  agents: any;
  configurations: any;
  agentsData: any;
  paginationConfig: PaginatePipeArgs;
  constructor(private store: Store, private formBuilder: FormBuilder, public router: Router, private matDialog: MatDialog) { }

  ngOnInit(): void {
    this.crawlerForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      agent_id: [null, [Validators.required]],
      experiment_id: [null, [Validators.required]],
      proxy_id: [null, [Validators.required]],
      configuration_id: [null, [Validators.required]],
    });
    this.getProxies();
    this.getAgents();
    this.getExperiment();
    this.getConfig();
    this.subscriptions.add(
      this.crawlerForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: CrawlerFormValues) => {
        this.store.dispatch(
          updateCrawlerCreateValues({
            name: formValue.name,
            description: formValue.description,
            agent_id: formValue.agent_id,
            configuration_id: formValue.configuration_id,
            experiment_id: formValue.experiment_id,
            proxy_id: formValue.proxy_id
          })
        );
      })
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectAgentsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  hasValue(controlName: string): boolean {
    return Boolean(this.crawlerForm.get(controlName)?.value);
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.crawlerForm.get(controlName)?.touched &&
      this.crawlerForm.get(controlName)?.invalid &&
      this.crawlerForm.get(controlName)?.getError(errorName)
    );
  }

  saveCrawler(): void {
    if (!this.crawlerForm.valid) {
      return
    }
    this.store.dispatch(completeCrawlerCreateRequested());
    this.router.navigate(['/crawlers'])
  }


  getProxies() {
    this.store.dispatch(proxyRequest())
    this.store.pipe(select(proxyList)).subscribe((proxy) => {
      this.proxies = proxy.data;
      this.crawlerForm.controls['proxy_id']?.setValue(this.proxies[0]?.id)
    })
  }


  getExperiment() {
    this.store.dispatch(experimentRequest())
    this.store.pipe(select(experimentList)).subscribe((experiment) => {
      this.experiments = experiment.data;
      this.crawlerForm.controls['experiment_id']?.setValue(this.experiments[0]?.id)

    })
  }

  getConfig() {
    this.store.dispatch(configRequest())
    this.store.pipe(select(configList)).subscribe((configurations) => {
      this.configurations = configurations.data;
      this.crawlerForm.controls['configuration_id']?.setValue(this.configurations[0]?.id)
    });
  }

  getAgents() {
    this.store.dispatch(agentRequest())
    this.store.pipe(select(agentList)).subscribe((agent) => {
      this.agents = agent.data;
      this.crawlerForm.controls['agent_id']?.setValue(this.agents[0]?.id)
    })
  }


  expirementPopup(): void {
    const experiementDialog = this.matDialog.open(ExperimentCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true,
    });
    if (experiementDialog) {
      experiementDialog.afterClosed().pipe().subscribe(experiement => {
        if (experiement) {
          this.getExperiment();
        }

      }, (err) => {
        console.log(err);
      });
    }
  }

  proxyPopup(): void {
    const proxyDialog = this.matDialog.open(ProxyCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true,
    });
    if (proxyDialog) {
      proxyDialog.afterClosed().pipe().subscribe(proxy => {
        if (proxy) {
          this.getProxies();
        }
      }, (err) => {
        console.log(err);
      });
    }
  }


  agentPopup(): void {
    const agentDialog = this.matDialog.open(AgentCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true
    });
    if (agentDialog) {
      agentDialog.afterClosed().pipe().subscribe(agent => {
        if (agent) {
          this.getAgents();
        }
      }, (err) => {
        console.log(err);
      });
    }
  }

  configurationPopup(): void {
    const configurationDialog = this.matDialog.open(ConfigCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true
    });
    if (configurationDialog) {
      this.subscriptions.add(
        configurationDialog.afterClosed().subscribe(configuration => {
          if (configuration) {
            this.getConfig();
          }
        }, (err) => {
          console.error(err);
        })
      )
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
