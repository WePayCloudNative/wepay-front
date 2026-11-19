import type { Configuration } from '@azure/msal-browser';

const runtimeConfig = window.RUNTIME_CONFIG;

export const msalConfig: Configuration = {
  auth: {
    clientId: runtimeConfig.VITE_SPA_CLIENT_ID,
    authority:
      'https://login.microsoftonline.com/' +
      runtimeConfig.VITE_ENTRA_TENANT_ID,
    redirectUri: window.location.origin + '/redirect.html',
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    // localStorage comparte la sesión entre pestañas del mismo navegador.
    // Con sessionStorage, cada pestaña nueva pedía iniciar sesión otra vez.
    cacheLocation: 'localStorage',
  },
};

export const tokenRequest = {
  scopes: [
    `api://${runtimeConfig.VITE_API_CLIENT_ID}/access_as_user`,
  ],
};