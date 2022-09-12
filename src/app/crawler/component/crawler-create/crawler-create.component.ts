import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { completeCrawlerCreateRequested, updateCrawlerCreateValues } from '../../store/crawler.actions';
import { CrawlerFormValues } from '../../model/crawler-form-values';
import { selectCrawlerFormValid } from '../../store/crawler.selectors';
import { selectExperimentsSimpleList } from '../../../experiment/store/experiment.selectors';
import { experimentsSimpleListRequested } from '../../../experiment/store/experiment.actions';
import { selectProxiesListData } from 'src/app/proxy/store/proxy.selectors';
import { selectAgentsListData, selectAgentsPagination } from 'src/app/agent/store/agent.selectors';
import { PaginatePipeArgs } from 'ngx-pagination';
import { MatDialog } from '@angular/material/dialog';
import { ConfigCreateComponent } from 'src/app/config/component/config-create/config-create.component';
import { AgentCreateComponent } from 'src/app/agent/component/agent-create/agent-create.component';
import { ProxyCreateComponent } from 'src/app/proxy/component/proxy-create/proxy-create.component';
import { ExperimentCreateComponent } from 'src/app/experiment/component/experiment-create/experiment-create.component';

@Component({
  selector: 'app-crawler-create',
  templateUrl: './crawler-create.component.html',
  animations: [fadeIn]
})
export class CrawlerCreateComponent implements OnInit, OnDestroy {
  crawlerForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  experiments$: Observable<any>;
  proxies$: Observable<any>;
  configuration$: Observable<any>;
  agentsData$: Observable<any>;
  paginationConfig: PaginatePipeArgs;


  constructor(private store: Store, private formBuilder: FormBuilder, public router: Router, private matDialog: MatDialog) { }

  ngOnInit(): void {
    this.agentsData$ = this.store.pipe(select(selectAgentsListData));
    this.agentsData$.subscribe(x => console.log('x', x));
    this.initPagination()
    this.store.dispatch(experimentsSimpleListRequested());

    this.proxies$ = this.store.pipe(select(selectProxiesListData));


    this.experiments$ = this.store.pipe(select(selectExperimentsSimpleList));
    this.experiments$.subscribe(x => {
      console.log(x)
    })
    console.log(this.experiments$)
    this.experiments$.subscribe((value) => console.log(value));
    // this.formValid$ = this.store.pipe(select(selectCrawlerFormValid));
    this.crawlerForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      agent_id: [null, [Validators.required]],
      experiment_id: [null, [Validators.required]],
      proxy_id: [null, [Validators.required]],
      configuration_id: [null, [Validators.required]],
    });

    this.subscriptions.add(
      this.crawlerForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: CrawlerFormValues) => {
        this.store.dispatch(
          updateCrawlerCreateValues({
            name: formValue.name,
            description: formValue.description,
            valid: this.crawlerForm.valid,
            agent_id: 1,
            configuration_id: 1,
            experiment_id: 1,
            proxy_id: 1
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
    this.store.dispatch(completeCrawlerCreateRequested());
  }


  /**
   * @methodName expirementPopup
   * @description set Experiment popup data
   * @parameters none
   * @return none
   */
  expirementPopup(): void {
    const proxyDialog = this.matDialog.open(ExperimentCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true,
    });
    if (proxyDialog) {
      proxyDialog.afterClosed().pipe().subscribe(proxy => {
        if (proxy) {
          const { data } = proxy;
          if (data.id) {
            // this.proxies.push(data)
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
  }


  /**
   * @methodName proxyPopup
   * @description set proxy popup data
   * @parameters none
   * @return none
   */
  proxyPopup(): void {
    const proxyDialog = this.matDialog.open(ProxyCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true,
    });
    if (proxyDialog) {
      proxyDialog.afterClosed().pipe().subscribe(proxy => {
        if (proxy) {
          const { data } = proxy;
          if (data.id) {
            // this.proxies.push(data)
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
  }

  /**
   * @methodName agentPopup
   * @description set agent popup data
   * @parameters none
   * @return void
   */
  agentPopup(): void {
    const agentDialog = this.matDialog.open(AgentCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true
    });
    if (agentDialog) {
      agentDialog.afterClosed().pipe().subscribe(agent => {
        if (agent) {
          const { data } = agent;
          if (data.id) {
            // this.agents.push(data);
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
  }


  /**
   * @methodName configurationPopup
   * @description open configuration Popup
   * @parameters none
   * @return void
   */
  configurationPopup(): void {
    const configurationDialog = this.matDialog.open(ConfigCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true
    });
    if (configurationDialog) {
      this.subscriptions.add(
        configurationDialog.afterClosed().subscribe(configuration => {
          if (configuration) {
            const { data } = configuration;
            if (data.id) {
              // this.configurations.push(data);
            }
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
