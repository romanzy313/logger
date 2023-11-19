// standard values

import { LogSeverity } from './types';

//

// this must be added when extending with the custom one?
export const logLevels = {
  trace: 0,
  debug: 100,
  info: 200,
  warning: 300,
  error: 400,
  fatal: 500,
} as const;
