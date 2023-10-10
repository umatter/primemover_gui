import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DownloadService {
  createBlob(data: Blob, identifier: string, type: string) {
    console.log(data);
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = identifier;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
