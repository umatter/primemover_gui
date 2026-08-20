import { environment } from '@environments/environment';

import { resolveApiBaseUrl } from './app-config';

/**
 * The API base URL has to be decided at RUNTIME, not build time: the same
 * bundle is served to a developer on localhost and to a colleague reaching the
 * deployment over the tailnet.
 *
 * index.html ships an empty `<meta name="config" property="api">`, and
 * httpd-pre-init/set-config.sh fills it from API_ENDPOINT when the container
 * starts. These tests pin that contract from the reading end.
 */
describe('resolveApiBaseUrl', () => {
  const SELECTOR = 'meta[name="config"][property="api"]';
  let created: HTMLMetaElement | null = null;

  function setTag(content: string | null): void {
    remove();
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'config');
    meta.setAttribute('property', 'api');
    if (content !== null) {
      meta.setAttribute('content', content);
    }
    document.head.appendChild(meta);
    created = meta;
  }

  function remove(): void {
    document.head.querySelectorAll(SELECTOR).forEach((el) => el.remove());
    created = null;
  }

  afterEach(() => remove());

  it('uses the injected endpoint when the meta tag is filled in', () => {
    setTag('https://pm-api.qamelab.org/api/v1');

    expect(resolveApiBaseUrl()).toBe('https://pm-api.qamelab.org/api/v1');
  });

  it('falls back to the build-time environment when the tag is empty', () => {
    // This is the local-development case: the tag ships empty and only a
    // deployed container fills it. Taking an empty value literally would send
    // every request to the GUI's own origin instead of the API.
    setTag('');

    expect(resolveApiBaseUrl()).toBe(environment.configService.apiBaseUrl);
  });

  it('falls back when the attribute is present but valueless', () => {
    // Angular's production HTML minifier rewrites content="" to a bare
    // `content` attribute. getAttribute then returns '' rather than null, and
    // an earlier version of set-config.sh did not match this spelling at all.
    setTag(null);
    created!.setAttribute('content', '');

    expect(resolveApiBaseUrl()).toBe(environment.configService.apiBaseUrl);
  });

  it('falls back when the tag is absent entirely', () => {
    remove();

    expect(resolveApiBaseUrl()).toBe(environment.configService.apiBaseUrl);
  });

  it('strips a trailing slash so callers do not build double slashes', () => {
    // Every caller composes `${apiBaseUrl}/thing`. A trailing slash produces
    // //thing, which some servers answer with a redirect that drops the
    // Authorization header.
    setTag('https://pm-api.qamelab.org/api/v1/');

    expect(resolveApiBaseUrl()).toBe('https://pm-api.qamelab.org/api/v1');
  });

  it('trims incidental whitespace', () => {
    setTag('  https://pm-api.qamelab.org/api/v1  ');

    expect(resolveApiBaseUrl()).toBe('https://pm-api.qamelab.org/api/v1');
  });
});
