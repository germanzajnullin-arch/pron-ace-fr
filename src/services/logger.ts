/* eslint-disable no-console */
/**
 * Namespaced console logger. Verbose in dev, quieter in prod.
 * Every audio lifecycle step must go through here.
 */

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV === true;

const stamp = () => new Date().toISOString().slice(11, 23);

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const createLogger = (namespace: string): Logger => {
  const prefix = `[${namespace}]`;
  return {
    debug: (...args) => {
      if (isDev) console.debug(`${stamp()} ${prefix}`, ...args);
    },
    info: (...args) => console.info(`${stamp()} ${prefix}`, ...args),
    warn: (...args) => console.warn(`${stamp()} ${prefix}`, ...args),
    error: (...args) => console.error(`${stamp()} ${prefix}`, ...args),
  };
};
