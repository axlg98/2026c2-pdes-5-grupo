import { runReadOnlyJourney } from './journey.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01']
  }
};

export default function () {
  runReadOnlyJourney();
}
