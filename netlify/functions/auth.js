export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nieprawidłowe zapytanie JSON' }) };
  }

  const expectedPassword = process.env.ADMIN_PASSWORD || 'Finalitie2026!';
  if (!body.password || body.password !== expectedPassword) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Nieprawidłowe hasło dostępu do panelu' })
    };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Błąd konfiguracji serwera: brak GITHUB_TOKEN w zmiennych środowiskowych Netlify' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ token })
  };
}
