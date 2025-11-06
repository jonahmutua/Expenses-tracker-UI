/**
 * Sample environment file 
 * npm start       -uses environment.ts (dev)
 * npm build  uses environment.prod.ts (prod)
 */
export const environment = { 
  production: false,
  apiBaseUrl: '', // e.g. 'http://localhost:3000' or your backend URL
  endpoints: {
    login: '/login',
    expenses: '/expenses'
  }

};