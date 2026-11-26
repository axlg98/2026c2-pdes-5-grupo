import http from 'k6/http';
import { check, sleep } from 'k6';

const removeTrailingSlash = (value) => value.replace(/\/+$/, '');
const backendUrl = removeTrailingSlash(__ENV.BACKEND_URL || 'http://localhost:3000');
const frontendUrl = removeTrailingSlash(__ENV.FRONTEND_URL || 'http://localhost:5173');
const flightApiUrl = removeTrailingSlash(__ENV.FLIGHT_API_URL || 'http://localhost:3001');
const apiUrl = `${backendUrl}/api`;

const credentials = {
  buyer: {
    email: __ENV.BUYER_EMAIL || 'comprador@ctv.com',
    password: __ENV.BUYER_PASSWORD || 'comprador123',
    role: 'comprador'
  },
  agency: {
    email: __ENV.AGENCY_EMAIL || 'agencia@ctv.com',
    password: __ENV.AGENCY_PASSWORD || 'agencia123',
    role: 'agencia'
  },
  admin: {
    email: __ENV.ADMIN_EMAIL || 'admin',
    password: __ENV.ADMIN_PASSWORD || '123456',
    role: 'admin'
  }
};

const parseJson = (response) => {
  try {
    return response.json();
  } catch {
    return null;
  }
};

const getJson = (name, url, token, validate) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = http.get(url, { headers, tags: { name } });
  const body = parseJson(response);

  check(response, {
    [`${name}: HTTP 200`]: (result) => result.status === 200,
    [`${name}: respuesta esperada`]: () => body !== null && validate(body)
  });

  return body;
};

const getPage = (name, url, validate) => {
  const response = http.get(url, { tags: { name } });
  check(response, {
    [`${name}: HTTP 200`]: (result) => result.status === 200,
    [`${name}: contenido esperado`]: validate
  });
  return response;
};

const login = ({ email, password, role }) => {
  const response = http.post(
    `${apiUrl}/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: `POST /api/auth/login (${role})` }
    }
  );
  const body = parseJson(response);
  const validLogin = body !== null &&
    typeof body.token === 'string' &&
    body.token.length > 0 &&
    body.usuario?.rol === role;

  check(response, {
    [`login ${role}: HTTP 200`]: (result) => result.status === 200,
    [`login ${role}: token y rol correctos`]: () => validLogin
  });

  return validLogin ? body.token : '';
};

export const runReadOnlyJourney = () => {
  const buyerToken = login(credentials.buyer);
  const agencyToken = login(credentials.agency);
  const adminToken = login(credentials.admin);

  getPage('GET frontend /', frontendUrl,
    (response) => response.body.includes('<div id="root">'));

  getJson('GET /health', `${backendUrl}/health`, null,
    (body) => body.status === 'ok');
  getJson('GET /api/paquetes', `${apiUrl}/paquetes`, null,
    (body) => Array.isArray(body.paquetes) && body.paquetes.length > 0);
  getJson('GET /api/hoteles', `${apiUrl}/hoteles`, null,
    (body) => Array.isArray(body) && body.length > 0);
  getPage('GET /api-docs/', `${backendUrl}/api-docs/`,
    (response) => response.body.includes('swagger'));

  getJson('GET /api/auth/me (comprador)', `${apiUrl}/auth/me`, buyerToken,
    (body) => body.usuario?.rol === 'comprador');
  getJson('GET /api/favoritos (comprador)', `${apiUrl}/favoritos`, buyerToken,
    (body) => Array.isArray(body.favoritos));
  getJson('GET /api/compras (comprador)', `${apiUrl}/compras`, buyerToken,
    (body) => Array.isArray(body.compras));

  getJson('GET /api/agencia/mia', `${apiUrl}/agencia/mia`, agencyToken,
    (body) => typeof body.agencia?.nombre === 'string');
  getJson('GET /api/agencia/paquetes', `${apiUrl}/agencia/paquetes`, agencyToken,
    (body) => Array.isArray(body.paquetes));
  getJson('GET /api/agencia/compras', `${apiUrl}/agencia/compras`, agencyToken,
    (body) => Array.isArray(body.compras));
  getJson('GET /api/auth/users (admin)', `${apiUrl}/auth/users`, adminToken,
    (body) => Array.isArray(body.usuarios) && body.usuarios.length > 0);

  getJson('GET Flight API /health', `${flightApiUrl}/health`, null,
    (body) => body.status === 'ok');
  getJson('GET /api/aerolineas (Flight API)', `${flightApiUrl}/api/aerolineas`, agencyToken,
    (body) => Array.isArray(body.aerolineas) && body.aerolineas.length > 0);
  const flightList = getJson(
    'GET /api/vuelos (Flight API)',
    `${flightApiUrl}/api/vuelos`,
    agencyToken,
    (body) => Array.isArray(body.vuelos) && body.vuelos.length > 0
  );
  getJson(
    'GET /api/vuelos?soloDisponibles=true (Flight API)',
    `${flightApiUrl}/api/vuelos?soloDisponibles=true`,
    agencyToken,
    (body) => Array.isArray(body.vuelos)
  );

  const flightId = flightList?.vuelos?.[0]?.id;
  if (Number.isInteger(flightId) && flightId > 0) {
    getJson(`GET /api/vuelos/${flightId} (Flight API)`,
      `${flightApiUrl}/api/vuelos/${flightId}`,
      agencyToken,
      (body) => body.vuelo?.id === flightId);
  } else {
    check(false, {
      'Flight API: listado incluye un vuelo con id válido': () => false
    });
  }

  sleep(Number(__ENV.THINK_TIME_SECONDS || '1'));
};
