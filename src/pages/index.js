// Pages barrel exports.
// The Editor is deliberately not re-exported here: it is lazy-loaded from
// App.jsx so that the scene store and three.js stay out of the entry chunk.
export { default as Landing } from './Landing'
export { Login, Register } from './Auth'
export { default as Dashboard } from './Dashboard'
