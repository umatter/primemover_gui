/**
 * Production fallback configuration.
 *
 * In a real deployment the API endpoint comes from the injected
 * `<meta name="config" property="api">` tag (see app-config.ts), which
 * `httpd-pre-init/set-config.sh` fills from the API_ENDPOINT environment
 * variable at container start. The value below is used only when that
 * injection did not happen -- that is, when the deployment is misconfigured.
 *
 * It is a same-origin relative path on purpose. A misconfigured deployment
 * should fail against its own origin rather than quietly send bearer tokens to
 * whatever absolute host happened to be baked into the bundle. This file
 * previously pointed at https://pm-api.test.primemover.example, an unrelated external
 * deployment.
 */
export const environment = {
  production: true,
  configService: {
    apiBaseUrl: '/api/v1'
  }
};
