import { BaseLogTransport, BaseLogTransportOptions } from '../abstracts';
import { LogLevel, LogSeverity, StdLog } from '../types';
import { Logging } from '@google-cloud/logging';
// docs https://cloud.google.com/logging/docs/reference/v2/rest/v2/entries/write

/**
 * googles:
 * enum LogSeverity {
      DEFAULT = 0,
      DEBUG = 100,
      INFO = 200,
      NOTICE = 300,
      WARNING = 400,
      ERROR = 500,
      CRITICAL = 600,
      ALERT = 700,
      EMERGENCY = 800
  }

 * this lib:
    trace: 0,
    debug: 100,
    info: 200,
    warning: 300,
    error: 400,
    fatal: 500,
 */
function formatSeverity(level: number): number {
  if (level == 0 || level == 100) return 100; // DEBUG ENUM
  else if (level == 200) return 200;
  else if (level == 300) return 400;
  else if (level == 400) return 500;
  else if (level == 500) return 600;

  // otherwise we dont know, so return 0
  return 0;
}

function formatSeverityLib(input: string): string {
  if (input == 'warning') return 'WARNING';
  if (input == 'fatal') return 'CRITICAL';
  return input.toUpperCase();
}

// https://cloud.google.com/logging/docs/reference/v2/rest/v2/MonitoredResource
type MonitoredResource = {
  type: string;
  labels?: { [k: string]: string };
};

type LogNameValue = string | ((log: StdLog<any>) => string);
type MonitoredResourceValue =
  | MonitoredResource
  | ((log: StdLog<any>) => MonitoredResource);

export type GoogleCloudLoggingTransportOptions = {
  API_KEY: string;

  logName: LogNameValue;

  // resource must be constant, or can depend on per log basis
  resource: MonitoredResourceValue;
  labels?: { key: string; value: string }[];

  // another fetch?
  fetch?: any;
};

export default class GoogleCloudLoggingTransport extends BaseLogTransport {
  private gLogging: Logging;
  protected googOpts: GoogleCloudLoggingTransportOptions;
  // private API_KEY: string
  // private logName: LogNameValue
  constructor(
    options: BaseLogTransportOptions & GoogleCloudLoggingTransportOptions
  ) {
    super(options, 1);

    this.googOpts = options;
    this.gLogging = new Logging({
      projectId: 'bedu2-403220',
    });
  }
  private valOrEval<T>(vv: any, log: StdLog<any>): T {
    return typeof vv === 'function' ? vv(log) : vv;
  }

  private generateBody(logs: StdLog<any>[]) {
    // omit logName and resource for now... include with each request
    const entries = logs.map(this.stdLogToLogEntry, this);
    console.log('entries are', entries);

    return {
      entries,
      partialSuccess: true, // good default?
    };
  }

  // TODO add this https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#HttpRequest
  private stdLogToLogEntry(log: StdLog<any>) {
    return {
      logName: this.valOrEval(this.googOpts.logName, log),
      resource: this.valOrEval(this.googOpts.resource, log),
      timestamp: log.timestamp.toISOString(),
      severity: formatSeverity(log.level),
      labels: this.googOpts.labels,
      jsonPayload: {
        value: log.value,
        meta: log.meta,
      },
    };
  }
  // projects//logs/test
  async send(logs: StdLog<any>[]) {
    try {
      const log = logs[0];
      const logName = log.meta.name || 'default';
      const severity = formatSeverityLib(log.severity);
      const metadata = {
        severity,
        resource: {
          type: 'project',
          labels: {
            // project_id: '1065060258809',
            project_id: 'bedu2-403220',
          },
        },
      };

      const gLog = this.gLogging.log(logName);
      const json_entry = gLog.entry(metadata, {
        value: log.value,
        meta: log.meta,
      });

      const res = await gLog.write(json_entry);

      console.log('write res', res);

      // auth is wierd https://cloud.google.com/docs/authentication/api-keys#console
      // const token = await this.gLogging.auth.getAccessToken();

      // if (!token) {
      //   console.log('bad token', token);
      //   return;
      // }

      // console.log('the token is', token);

      // const res = await fetch(
      //   `https://logging.googleapis.com/v2/entries:write`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       Authorization: `Bearer: ${token}`,
      //       'X-goog-api-key': this.googOpts.API_KEY,
      //       'Content-Type': 'application/json; charset=utf-8',
      //     },
      //     body: JSON.stringify(this.generateBody(logs)),
      //   }
      // );

      // console.log('fetch result', res);

      // console.log(await res.text());
    } catch (error) {
      console.error('failed to send the log');
      console.error(error);
    }

    return Promise.resolve();
  }
}
