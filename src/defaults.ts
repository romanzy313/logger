export function defaultLogFormatter(log: string[]) {
  const result = {};

  for (let i = 0; i < log.length; i++) {
    const value = log[i];
    result[i] = value;
  }

  return result;
}
