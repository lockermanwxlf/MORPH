export const isServer = typeof window === "undefined";
export const isElectron = !isServer && !!window?.electronAPI;
export const isBrowser = !isServer && !isElectron;
