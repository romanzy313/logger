type LogEntry = {
  timestamp: Date;
  level: number;
  jsonPayload: any;
};

export interface IDataBuffer<T> {
  push(item: T): void;
  flush(): Promise<void>;
  flushAndWaitForAll(): Promise<void>;
}

// this one is only used in console, so it doesnt really await things
export class DataBufferSingle<T> implements IDataBuffer<T> {
  constructor(private flushFunction: (data: T[]) => Promise<void>) {}

  public push(item: T) {
    this.flushFunction([item]);
  }

  public flush() {
    return Promise.resolve();
  }
  public flushAndWaitForAll() {
    return Promise.resolve();
  }
}

export class DataBufferWithoutTimeout<T> implements IDataBuffer<T> {
  private buffer: T[] = [];
  private i = 0;
  private pending: Record<number, Promise<void>> = {};

  constructor(
    private flushFunction: (data: T[]) => Promise<void>,
    private bufferSize: number
  ) {}

  public push(item: T) {
    this.buffer.push(item);
    if (this.buffer.length >= this.bufferSize) this.flush();
  }

  public flush() {
    if (this.buffer.length > 0) {
      const thisI = this.i++;
      const promise = new Promise<void>((resolve) => {
        this.flushFunction(this.buffer)
          .then((_) => {
            delete this.pending[thisI];
            resolve();
          })
          // never fail, maybe a retry strategy?
          .catch((_) => {
            delete this.pending[thisI];
            resolve();
          });
        this.buffer = [];
      });
      this.pending[thisI] = promise;
      return promise;
    }

    return Promise.resolve();
  }

  // instead do a promise all here
  public async flushAndWaitForAll() {
    this.flush();
    const promiseArr = Object.values(this.pending);
    await Promise.all(promiseArr);
  }
}

export class DataBufferWithTimeout<T> implements IDataBuffer<T> {
  private buffer: T[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor(
    private flushFunction: (data: T[]) => Promise<void>,
    private bufferSize: number,
    private flushInterval: number
  ) {
    // is this needed?
    setInterval(this.flush.bind(this), this.flushInterval);
  }

  public push(item: T): void {
    this.buffer.push(item);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
      // if (this.flushTimeout) {
      //   clearTimeout(this.flushTimeout);
      //   this.flushTimeout = null;
      // }
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(this.flush.bind(this), this.flushInterval);
    }
  }

  public flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.buffer.length > 0) {
        this.flushFunction(this.buffer)
          .then((_) => {
            resolve();
          })
          .catch((_) => {
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

  //TODO finish this
  public flushAndWaitForAll(): Promise<void> {
    return Promise.resolve();
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
