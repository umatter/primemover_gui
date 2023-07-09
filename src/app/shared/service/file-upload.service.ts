import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '@app/app-config';
import { Observable } from 'rxjs/internal/Observable';
import { Experiment } from '@app/experiment/model/experiment';
import { Crawler } from '@app/crawler/model/crawler';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(private http: HttpClient, private config: AppConfig) {}

  uploadExperiment(file: File, experiment: Experiment): Observable<any> {
    const formData = new FormData();
    formData.append('json', file, file.name);

    return this.http.post(`${this.config.apiBaseUrl}/experiments/${experiment.id}/upload`, formData);
  }

  uploadCrawler(file: File, crawler: Crawler): Observable<any> {
    const formData = new FormData();
    formData.append('json', file, file.name);

    return this.http.post(`${this.config.apiBaseUrl}/crawler/${crawler.id}/upload`, formData);
  }
}
