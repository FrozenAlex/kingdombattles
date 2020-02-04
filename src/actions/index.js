// import { search } from './search';
import {login, logout} from './account'
import {storeProfile, clearProfile} from './profile'

// Store provides direct access to store, Every function's first argument is current store
export const actions = (store) => ({
  // User functions
  login: (...args) => login(...args),
  logout: (...args) => logout(...args),

  // Profile functions
  storeProfile: (...args) => storeProfile(...args),
  clearProfile: (...args) => clearProfile(...args)
});