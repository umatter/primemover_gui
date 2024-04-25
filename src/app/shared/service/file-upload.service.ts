import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '@app/app-config';
import { Observable } from 'rxjs/internal/Observable';
import { httpContext } from '@shared/error-handler/http-context';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(
    private http: HttpClient,
    private config: AppConfig
  ) {}

  uploadExperiment(file: File, id: number): Observable<any> {
    const formData = this.getFormData(file);

    return this.http.post(`${this.config.apiBaseUrl}/experiments/${id}/upload`, formData, {
      context: httpContext
    });
  }

  uploadCrawler(file: File, id: number): Observable<any> {
    const formData = this.getFormData(file);

    return this.http.post(`${this.config.apiBaseUrl}/crawlers/${id}/upload`, formData, {
      context: httpContext
    });
  }

  private getFormData(file: File) {
    const formData = new FormData();
    formData.append('json', file, file.name);

    return formData;
  }
}
