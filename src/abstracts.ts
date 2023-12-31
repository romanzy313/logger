import { LogLevel, LogSeverity, StdLog } from './types';
import {
  IDataBuffer,
  DataBufferWithTimeout,
  DataBufferSingle,
  DataBufferWithoutTimeout,
} from './utils/DataBuffer';

type TimestampFormatter = 'ISO123123' | 'unix' | (() => any);

export type BaseLogTransportOptions = {
  minLevel?: LogSeverity | LogLevel;
  maxLevel?: LogSeverity | LogLevel;

  // in ms whats the maximum time to wait before flushing the logs
  // if set to null, it means never flush on time, always flush manually
  flushDelay?: number | null;
};

export type BaseLogTransportInternalOptions = {
  minLevel: LogSeverity | LogLevel;
  maxLevel: LogSeverity | LogLevel;
  maxFlushDelay: number | null; // in ms whats the maximum time before flushing the logs
};

function processOptions(
  opts: BaseLogTransportOptions
): BaseLogTransportInternalOptions {
  return {
    minLevel: opts.minLevel || 0,
    maxLevel: opts.maxLevel || Infinity,
    maxFlushDelay: opts.flushDelay || null,
  };
}

export abstract class BaseLogTransport {
  protected options: BaseLogTransportInternalOptions;
  private dataBuffer: IDataBuffer<StdLog<any>>;
  constructor(
    options: BaseLogTransportOptions,
    protected maxBatchSize: number // defined per endpoint
  ) {
    this.options = processOptions(options);

    if (maxBatchSize <= 1 || options.flushDelay === 0) {
      // dont accumulate, send right away
      this.dataBuffer = new DataBufferSingle(this.send.bind(this));
    } else if (options.flushDelay === null) {
      // accumulate but never autoflush
      // useful in serverless functions, where end of it is awaited
      // to send the logs
      this.dataBuffer = new DataBufferWithoutTimeout(
        this.send.bind(this),
        maxBatchSize
      );
    } else {
      const flushDelay = options.flushDelay || 1000;
      this.dataBuffer = new DataBufferWithTimeout(
        this.send.bind(this),
        maxBatchSize,
        flushDelay
      );
    }
  }

  // when new log comes
  // we queue it up
  public queue(log: StdLog<any>) {
    // only logs with properly defined levels are allowed to come here
    // adds it to the list of current logs

    // preformat it

    this.dataBuffer.push(log);
  }

  public waitForAllLogs() {
    return this.dataBuffer.flushAndWaitForAll();
  }

  abstract send(logs: StdLog<any>[]): Promise<void>;
}
