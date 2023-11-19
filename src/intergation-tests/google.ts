import { Logger } from '../index';
import GoogleCloudLoggingTransport from '../transport/GoogleCloudLoggingTransport';

// run with
// pnpm vite-node ./src/integration-tests/google.ts

// i always get
/**
 *   "error": {
    "code": 403,
    "message": "Permission 'logging.logEntries.create' denied on resource (or it may not exist).",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "IAM_PERMISSION_DENIED",
        "domain": "iam.googleapis.com",
        "metadata": {
          "permission": "logging.logEntries.create"
        }
      },
      {
        "@type": "type.googleapis.com/google.logging.v2.WriteLogEntriesPartialErrors",
        "logEntryErrors": {
          "0": {
            "code": 7,
            "message": "Permission 'logging.logEntries.create' denied on resource (or it may not exist)."
          }
        }
      }
    ]
  }
 */

// this needs Oauth2....

import 'dotenv/config';

const API_KEY = process.env.GOOGLE_API_KEY;
const PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER;

if (!API_KEY) throw new Error(`BAD GOOGLE API KEY ${API_KEY}`);

if (!PROJECT_NUMBER)
  throw new Error(`BAD GOOGLE PROJECT NUMBER ${PROJECT_NUMBER}`);

console.log('name', `projects/${PROJECT_NUMBER}/logs/${'test'}`);

const logger = new Logger<{ name: string }>({
  defaultMeta: {
    name: 'default',
  },
  transports: [
    new GoogleCloudLoggingTransport({
      flushDelay: null,
      API_KEY,
      logName: (log) => `projects/${PROJECT_NUMBER}/logs/${log.meta.name}`,
      //   resource: {
      //     type: 'project',
      //     labels: {
      //       project_id: 'xxx',
      //     },
      //   },
      resource: {
        type: 'global',
      },
    }),
  ],
});

logger.info('hello', 'world', Math.random());

logger.waitForAllTransportsToSend();

console.log('good?');
