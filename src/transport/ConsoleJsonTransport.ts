import { BaseLogTransport, BaseLogTransportOptions } from '../abstracts';
import { LogLevel, LogSeverity, StdLog } from '../types';

export default class ConsoleJsonTransport extends BaseLogTransport {
  constructor(options: Omit<BaseLogTransportOptions, 'flushDelay'>) {
    super(options, 1);
  }

  send(logs: StdLog<any>[]) {
    const log = logs[0];
    const logFn = this.getLogFn(log.level);

    logFn({
      // maybe do this? but the value needs to be a string
      // ...log.value,
      level: log.level,
      severity: log.severity,
      value: log.value,
      meta: log.meta,
      time: log.timestamp.toString(),
    });

    return Promise.resolve();
  }

  private getLogFn(level: LogLevel) {
    if (level >= 400) {
      return console.error;
    } else if (level < 200) {
      return console.debug;
    } else if (level < 300) {
      return console.log;
    } else {
      return console.warn;
    }
    // if (level == 'info') return console.log;
    // else if (level == 'warn') return console.log;
    // else return console.error;
  }
}
