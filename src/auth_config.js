export const authConfig = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "dev-n5t4wuedvu54i50n.us.auth0.com", //  Dominio especificado
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "RAGeU3e1tK7ouPcQQGXklucarJ2Xbhmp",      // Client ID de Auth0
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || "https://api.g6-arquisis.com",   //  Audience crítico especificado
    scope: "openid profile email"  //  Scope especificado
  },
  // Configuración adicional para desarrollo
  useRefreshTokens: true,
  cacheLocation: 'localstorage'
};
