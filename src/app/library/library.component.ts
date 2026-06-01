import { Component } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { fadeIn } from '@shared/animation/trigger';

interface LibraryEntry {
  titleKey: string;
  descKey: string;
  route: string;
  icon: 'identity' | 'connection' | 'behavior';
}

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  standalone: true,
  imports: [NgForOf, NgIf, RouterLink, TranslateModule],
  animations: [fadeIn]
})
export class LibraryComponent {
  entries: LibraryEntry[] = [
    { titleKey: 'library.agents.title', descKey: 'library.agents.body', route: '/agents', icon: 'identity' },
    { titleKey: 'library.proxies.title', descKey: 'library.proxies.body', route: '/proxies', icon: 'connection' },
    { titleKey: 'library.configs.title', descKey: 'library.configs.body', route: '/configurations', icon: 'behavior' }
  ];
}
