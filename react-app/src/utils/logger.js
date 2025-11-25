// Simple logging utility - can be disabled in production
const isDevelopment = import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  warn: (...args) => {
    // Always show warnings
    console.warn(...args)
  },
  
  error: (...args) => {
    // Always show errors
    console.error(...args)
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  }
}


