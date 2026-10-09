export const SPLASH_KEY = 'lc-splash'

/**
 * Runs before paint (in <head>): if the splash was already shown this visit,
 * or the user prefers less motion, mark <html> so CSS hides it — no flash.
 */
export const SPLASH_BOOT = `try{if(sessionStorage.getItem('${SPLASH_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('splash-seen')}catch(e){}`
