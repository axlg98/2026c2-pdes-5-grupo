import { runReadOnlyJourney } from './journey.js';

const maxVUs = Number(__ENV.MAX_VUS || '80');
if (!Number.isInteger(maxVUs) || maxVUs < 2) {
  throw new Error('MAX_VUS debe ser un entero igual o mayor que 2.');
}

export const options = {
  stages: [
    { duration: '30s', target: Math.ceil(maxVUs / 5) },
    { duration: '30s', target: Math.ceil(maxVUs / 2) },
    { duration: '1m', target: maxVUs },
    { duration: '1m', target: maxVUs },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    checks: ['rate>0.95'],
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000']
  }
};

export default function () {
  runReadOnlyJourney();
}
