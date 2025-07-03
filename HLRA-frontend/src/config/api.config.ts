export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL,
  endpoints: {
    auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      google: '/auth/google',
      github: '/auth/github',
      callback: '/auth/callback',
      me: '/auth/me'
    }
  }
};