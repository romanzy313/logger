import { BaseLogTransport } from './abstracts';
import { defaultLogFormatter } from './defaults';
import { logLevels } from './logLevels';
import { LogLevel, LogSeverity, StdLog } from './types';

type InternalConfig<Meta> = {
  logFormatter: (log: any[]) => any;
  transports: BaseLogTransport[];
  logLevels: Record<number, string>;
  defaultMeta: Meta;
};

type Config<Meta> = {
  /**
   *
   * @param log arguments passed into the logger
   * @returns any kind of JSON-serializable shape (object, array, string). Defaults to {0: val0, 1: val1}
   */
  logFormatter?: (log: any[]) => any;
  transports?: any[];
  defaultMeta?: Meta;
};

function processConfig<Meta>(config: Config<Meta>): InternalConfig<Meta> {
  return {
    logFormatter: config.logFormatter || defaultLogFormatter,
    transports: config.transports || [],
    defaultMeta: config.defaultMeta || ({} as any),
    logLevels: logLevels,
  };
}

// function createRuntime<Meta>(config: InternalConfig<Meta>): Runtime<Meta> {
//   return {
//     collectedLogs: [],
//     logLevels: logLevels,
//   };
// }

type LogLevels = Record<number, string>;
class LoggerChain<Meta> {
  protected config: InternalConfig<Meta>;
  private __meta: Meta;
  constructor(config: InternalConfig<Meta>, meta: Partial<Meta>) {
    this.config = config;
    this.__meta = {
      ...config.defaultMeta,
      ...meta,
    };
  }

  private getLevelFromSeverity(severity: LogSeverity) {
    //
  }

  private getSeverityFromLogLevel(level: LogLevel) {
    // const value = this.runtime[level];
    // if (value === undefined) {
    //   throw new Error(
    //     `bad log name ${name}, available options are ${Object.keys(levels).join(
    //       ', '
    //     )}`
    //   );
    // }
    // return value;
  }

  meta(meta: Partial<Meta>): LoggerChain<Meta> {
    return new LoggerChain(this.config, {
      ...this.__meta,
      ...meta,
    });
  }

  protected log(level: LogLevel, severity: LogSeverity, args: any[]) {
    // lala
    // create the log
    const logData: StdLog<Meta> = {
      level: level,
      severity: severity,
      value: this.config.logFormatter(args),
      meta: this.__meta,
      timestamp: new Date(),
    };

    // now see if this is suitable for the transports

    console.log('transports', this.config.transports);
    for (let i = 0; i < this.config.transports.length; i++) {
      const transport = this.config.transports[i];

      // do level checking here
      // if (logData.level >= transport.options.minLevel)

      transport.queue(logData);
    }
  }

  addTransport(transport: BaseLogTransport) {
    // extract level from the name or level
    this.config.transports.push(transport);
  }

  // base log methods

  trace(...args: any[]) {
    this.log(0, 'trace', args);
  }

  debug(...args: any[]) {
    this.log(100, 'debug', args);
  }

  info(...args: any[]) {
    this.log(200, 'info', args);
  }
  warn(...args: any[]) {
    this.log(300, 'warn', args);
  }
  error(...args: any[]) {
    this.log(400, 'error', args);
    //
  }
  fatal(...args: any[]) {
    this.log(500, 'fatal', args);
    //
  }
}

export class Logger<Meta = unknown> extends LoggerChain<Meta> {
  static logLevels: LogLevels;

  constructor(config: Config<Meta>) {
    const innerConfig = processConfig(config);
    super(innerConfig, {});

    // add extra level
  }

  addTransport(transport: BaseLogTransport) {
    //
    this.config.transports.push(transport);
  }

  async waitForAllTransportsToSend() {
    return Promise.all(this.config.transports.map((t) => t.waitForAllLogs()));
  }
}

// example
class CustomLevel<Meta> extends Logger<Meta> {
  constructor(config: Config<Meta>) {
    super(config);
    this.config.logLevels['emergency'] = 900;
  }

  emergency(...args: any) {
    this.log(900, 'emergency', args);
  }
}
