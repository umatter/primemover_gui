export enum ProxyType {
  HTTP = 'http',
  OXYLABS = 'oxylabs',
  BRIGHTDATA = 'brightdata'
}

export const usernamePasswortRequiredFor = [ProxyType.OXYLABS, ProxyType.BRIGHTDATA];
