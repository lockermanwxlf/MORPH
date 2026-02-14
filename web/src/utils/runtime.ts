export const isServer = typeof window === "undefined";
export const isElectron = !isServer && !!window?.process?.versions?.electron;
export const isBrowser = !isServer && !isElectron;
