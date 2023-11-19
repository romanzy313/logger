/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger } from './index';
import { BaseLogTransport, BaseLogTransportOptions } from './abstracts';

type Meta = {
  name: string;
};

let logger: Logger<Meta>;

let testTransport: BaseLogTransport;
let sendFn: ReturnType<typeof vi.fn>;

class TestLogTransport extends BaseLogTransport {
  constructor(options: BaseLogTransportOptions) {
    super(options, 1);
  }

  async send(logs) {
    //
    sendFn(logs);

    return;
  }
}

/**
 * Dummy test
 */
describe('Logger tests', () => {
  beforeEach(() => {
    sendFn = vi.fn(async () => {});
    testTransport = new TestLogTransport({
      minLevel: 'warn',
    });

    logger = new Logger({
      defaultMeta: {
        name: 'default',
      },
      transports: [],
    });
    vi.useFakeTimers().setSystemTime(new Date('2020-01-01'));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('logs once', () => {
    logger.addTransport(testTransport);
    logger.warn('hello', 'world');

    expect(sendFn).toHaveBeenCalledOnce();
    expect(sendFn).toHaveBeenLastCalledWith([
      {
        level: 300,
        meta: {
          name: 'default',
        },
        severity: 'warn',
        timestamp: new Date('2020-01-01T00:00:00.000Z'),
        value: {
          0: 'hello',
          1: 'world',
        },
      },
    ]);
  });

  it('meta works', () => {
    logger.addTransport(testTransport);
    logger
      .meta({
        name: 'new one',
      })
      .error('hello', 'world');

    expect(sendFn).toHaveBeenCalledOnce();
    expect(sendFn).toHaveBeenLastCalledWith([
      {
        level: 400,
        meta: {
          name: 'new one',
        },
        severity: 'error',
        timestamp: new Date('2020-01-01T00:00:00.000Z'),
        value: {
          0: 'hello',
          1: 'world',
        },
      },
    ]);
  });
});
