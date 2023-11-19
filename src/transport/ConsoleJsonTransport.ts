import { BaseLogTransport, BaseLogTransportOptions } from '../abstracts';
import { LogLevel, LogSeverity, StdLog } from '../types';

export default class ConsoleJsonTransport extends BaseLogTransport {
  constructor(options: Omit<BaseLogTransportOptions, 'flushDelay'>) {
    super(options, 1);
  }

  send(logs: StdLog<any>[]) {
    // size of the logs will be 1, as max batch is set to 1
    // for (let i = 0; i < logs.length; i++) {
    //   const log = logs[i];
    //   const logFn = this.getLogFn(log.logLevel);
    // }
    const log = logs[0];
    const logFn = this.getLogFn(log.level);

    logFn({
      // maybe do this?
      ...log.value,
      // this is more universal:
      // data: log.value,
      severity: log.severity,
      meta: log.meta,
      time: log.timestamp,
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
