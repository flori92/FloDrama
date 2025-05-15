export function logInfo(message: string, ...args: any[]) {
  console.info(`[INFO] ${message}`, ...args);
}
export function logError(message: string, ...args: any[]) {
  console.error(`[ERROR] ${message}`, ...args);
}
