export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/links') {
      if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405, { Allow: 'POST' });
      return createLink(request, env);
    }

    const match = url.pathname.match(/^\/([A-Za-z0-9]{7})\/?$/);
    if (match && request.method === 'GET') return redirectLink(match[1], env);

    // Assets serves the website (and handles its normal static-file 404s).
    return env.ASSETS.fetch(request);
  }
};

async function createLink(request, env) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 8192) return json({ error: 'A solicitação é muito grande.' }, 413);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Envie um JSON válido com o campo url.' }, 400); }

  if (typeof body?.url !== 'string' || body.url.length > 4096) {
    return json({ error: 'O link é obrigatório e deve ter no máximo 4096 caracteres.' }, 400);
  }

  let target;
  try { target = new URL(body.url); }
  catch { return json({ error: 'Digite um endereço válido, incluindo https://.' }, 400); }
  if (!['http:', 'https:'].includes(target.protocol) || !target.hostname || target.username || target.password) {
    return json({ error: 'Use um endereço http:// ou https:// válido.' }, 400);
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = randomSlug();
    try {
      const result = await env.DB.prepare(
        'INSERT INTO links (slug, target_url) VALUES (?, ?) ON CONFLICT(slug) DO NOTHING'
      ).bind(slug, target.href).run();
      if (result.meta.changes === 1) return json({ slug }, 201);
    } catch (error) {
      console.error('D1 insert failed:', error);
      return json({ error: 'Não foi possível salvar o link agora. Tente novamente mais tarde.' }, 500);
    }
  }
  return json({ error: 'Não foi possível gerar um código único. Tente novamente.' }, 503);
}

async function redirectLink(slug, env) {
  try {
    const row = await env.DB.prepare('SELECT target_url FROM links WHERE slug = ?').bind(slug).first();
    if (!row) return new Response('Este link não existe ou foi removido.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: row.target_url,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer'
      }
    });
  } catch (error) {
    console.error('D1 lookup failed:', error);
    return new Response('Serviço temporariamente indisponível.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
}

function randomSlug(length = 7) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }
  });
}
