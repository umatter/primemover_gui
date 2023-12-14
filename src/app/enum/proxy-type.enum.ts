export enum ProxyType {
  GEOSURF = 'geosurf',
  HTTP = 'http',
  OXYLABS = 'oxylabs',
  BRIGHTDATA = 'brightdata'
}

export const usernamePasswortRequiredFor = [ProxyType.GEOSURF, ProxyType.OXYLABS, ProxyType.BRIGHTDATA];
