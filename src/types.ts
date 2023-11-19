import { logLevels } from './logLevels';

export type LogLevel = number;
export type LogSeverity = keyof typeof logLevels | string;

export type StdLog<Meta> = {
  level: number;
  severity: LogSeverity;
  value: any; // object in format {0:, 1: , 2: }, should be customizable to be an array too? or turned into a single string?
  meta: Meta;
  timestamp: Date; // must be already converted to string or number?
  location?: string; // like find out where the log is happening
};
