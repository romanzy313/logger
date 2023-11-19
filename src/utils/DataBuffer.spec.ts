import { beforeEach, afterEach, expect, describe, test, vi, it } from 'vitest';

import { DataBufferWithTimeout } from './DataBuffer'; // Import the DataBuffer class from your implementation file

describe('DataBuffer', () => {
  let flushFunction: any;
  let buffer: DataBufferWithTimeout<number>;

  beforeEach(() => {
    flushFunction = vi.fn(async () => {
      // make it async
    });
    buffer = new DataBufferWithTimeout<number>(flushFunction, 10, 1000);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('should flush when buffer reaches 100 items', () => {
    for (let i = 0; i < 29; i++) {
      buffer.push(i);
    }

    expect(flushFunction).toHaveBeenCalledTimes(2);
    expect(flushFunction).toHaveBeenCalledWith(
      expect.arrayContaining(Array.from({ length: 10 }, (_, index) => index))
    );

    vi.advanceTimersByTime(1100);
    expect(flushFunction).toHaveBeenCalledTimes(3);
    expect(flushFunction).toHaveBeenCalledWith(
      expect.arrayContaining(Array.from({ length: 9 }, (_, index) => index))
    );
  });

  test('should flush every 1 second', async () => {
    buffer.push(1);
    buffer.push(2);

    vi.advanceTimersByTime(1100);

    expect(flushFunction).toHaveBeenCalledTimes(1);
    expect(flushFunction).toHaveBeenCalledWith(expect.arrayContaining([1, 2]));

    buffer.push(3);
    buffer.push(4);

    vi.advanceTimersByTime(1100);

    expect(flushFunction).toHaveBeenCalledTimes(2);
    expect(flushFunction).toHaveBeenCalledWith(expect.arrayContaining([3, 4]));
  });

  // test('should flush remaining data on process exit', () => {
  //   buffer.push(1);
  //   buffer.push(2);
  //   buffer.push(3);

  //   // @ts-expect-error
  //   process.emit('exit');

  //   expect(flushFunction).toHaveBeenCalledTimes(1);
  //   expect(flushFunction).toHaveBeenCalledWith(
  //     expect.arrayContaining([1, 2, 3])
  //   );
  // });
});
