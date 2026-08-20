import { environment } from '@environments/environment';

/**
 * Runtime configuration for the app.
 *
 * `apiBaseUrl` is where the BROWSER reaches the API, so it cannot be fixed at
 * build time: the same bundle is served to a developer on localhost and to a
 * colleague reaching the deployment over the tailnet, and those are different
 * URLs.
 */
export class AppConfig {
  apiBaseUrl: string;
}

/**
 * Resolve the API base URL for this page load.
 *
 * Order:
 *
 * 1. `<meta name="config" property="api" content="...">` in index.html. The tag
 *    ships empty and is filled in at container start by
 *    `httpd-pre-init/set-config.sh` from the `API_ENDPOINT` environment
 *    variable. This is what lets one build be deployed to any host.
 * 2. Otherwise `environment.configService.apiBaseUrl`, which keeps `ng serve`
 *    and the unit tests working exactly as before, with no container involved.
 *
 * The tag is present but EMPTY during local development, so an empty `content`
 * must fall through rather than be taken literally -- otherwise every request
 * would be issued against an empty base and silently hit the GUI's own origin.
 */
export function resolveApiBaseUrl(): string {
  const meta =
    typeof document === 'undefined'
      ? null
      : document.querySelector('meta[name="config"][property="api"]');

  const injected = meta?.getAttribute('content')?.trim();

  if (injected) {
    // Tolerate a trailing slash from whoever set API_ENDPOINT: every caller
    // builds URLs as `${apiBaseUrl}/thing`, so a trailing slash yields a double
    // slash and, on some servers, a redirect that drops the Authorization
    // header.
    return injected.replace(/\/+$/, '');
  }

  return environment.configService.apiBaseUrl;
}

/** Resolved once per page load and provided through DI as `AppConfig`. */
export const appConfig: AppConfig = {
  apiBaseUrl: resolveApiBaseUrl(),
};
