type LogEntry = {
  timestamp: Date;
  level: number;
  jsonPayload: any;
};

export type DataBufferConfig = {
  maxInterval: number;
  maxCount: number;
};

export interface IDataBuffer<T> {
  push(item: T): void;
  flush(): Promise<void>;
}

export class DataBufferNoPromise<T> implements IDataBuffer<T> {
  constructor(private flushFunction: (data: T[]) => Promise<void>) {}

  public push(item: T) {
    this.flushFunction([item]);
  }

  public flush() {
    return Promise.resolve();
  }
}

// this does have a timeout

export class DataBufferWithTimeout<T> implements IDataBuffer<T> {
  private buffer: T[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor(
    private flushFunction: (data: T[]) => Promise<void>,
    private opts: DataBufferConfig
  ) {
    // is this needed?
    setInterval(this.flush.bind(this), this.opts.maxInterval);
  }

  public push(item: T): void {
    this.buffer.push(item);

    if (this.buffer.length >= this.opts.maxCount) {
      this.flush();
      // if (this.flushTimeout) {
      //   clearTimeout(this.flushTimeout);
      //   this.flushTimeout = null;
      // }
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(
        this.flush.bind(this),
        this.opts.maxInterval
      );
    }
  }

  public flush(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const this2 = this;
    console.log('this 2', this2);

    return new Promise((resolve) => {
      console.log('IN PROMISE this ', this, 'this2', this2);

      if (this.buffer.length > 0) {
        this.flushFunction(this.buffer).then((v) => {
          resolve();
        });
        this.buffer = [];
      }
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = null;
      }
    });
  }
}

// Example usage
// const buffer = new DataBuffer<number>((data) => {
//   console.log("Flushing data:", data);
// }, {
//     maxCount: 100,
//     maxTimeSeconds: 3
// });

// // Simulate incoming data
// for (let i = 0; i < 250; i++) {
//   buffer.push(i);
// }
