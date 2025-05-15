export function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function isNonEmptyString(str: string): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}
