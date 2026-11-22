const form = document.getElementById('shortenForm');
const message = document.getElementById('formMessage');
const button = document.getElementById('shortenButton');
const resultCard = document.getElementById('resultCard');
const shortUrl = document.getElementById('shortUrl');
const destination = document.getElementById('destination');
const copyButton = document.getElementById('copyButton');
const configReady = typeof SUPABASE_URL === 'string' && typeof SUPABASE_ANON_KEY === 'string'
  && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('SEU-PROJETO')
  && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('SUA_CHAVE');

if (document.getElementById('year')) document.getElementById('year').textContent = new Date().getFullYear();

function apiHeaders(extra = {}) {
  return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, ...extra };
}

function setMessage(text, kind = '') {
  if (!message) return;
  message.textContent = text;
  message.className = `form-message ${kind}`.trim();
}

function normalizeUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('Digite um endereço válido, incluindo https://.'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Use um endereço que comece com http:// ou https://.');
  return parsed.href;
}

function randomSlug(length = 7) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function appBase() {
  const configured = typeof APP_BASE_PATH === 'string' ? APP_BASE_PATH : '/';
  return `${location.origin}${configured.endsWith('/') ? configured : `${configured}/`}`;
}

async function shorten(url) {
  if (!configReady) throw new Error('Configure o projeto Supabase em config.js e execute schema.sql antes de usar o encurtador.');
  const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/links`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = randomSlug();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: apiHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ slug, target_url: url })
    });
    if (response.ok) return `${appBase()}${slug}`;
    if (response.status !== 409) {
      const detail = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) throw new Error('A chave ou as permissões do Supabase não estão configuradas corretamente.');
      throw new Error(detail.message || 'Não foi possível salvar o link. Confira a configuração do banco e tente novamente.');
    }
  }
  throw new Error('Não foi possível gerar um código único. Tente novamente.');
}

async function lookup(slug) {
  if (!configReady) throw new Error('O encurtador ainda não está configurado.');
  const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/links?slug=eq.${encodeURIComponent(slug)}&select=target_url&limit=1`;
  const response = await fetch(endpoint, { headers: apiHeaders() });
  if (!response.ok) throw new Error('Não foi possível consultar o link agora. Tente novamente mais tarde.');
  const rows = await response.json();
  if (!rows.length) throw new Error('Este link não existe ou foi removido.');
  return normalizeUrl(rows[0].target_url);
}

async function redirectIfShortLink() {
  const basePath = typeof APP_BASE_PATH === 'string' ? APP_BASE_PATH : '/';
  const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const pathname = decodeURIComponent(location.pathname);
  if (!pathname.startsWith(cleanBase)) return false;
  const slug = pathname.slice(cleanBase.length).split('/')[0];
  if (!slug || slug === 'index.html' || slug === '404.html') return false;
  try {
    const target = await lookup(slug);
    location.replace(target);
  } catch (error) {
    if (message) setMessage(error.message, 'error');
    const title = document.querySelector('h1');
    if (title) title.innerHTML = 'Ops, esse link<br><span>não foi encontrado.</span>';
  }
  return true;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    resultCard.hidden = true;
    let url;
    try { url = normalizeUrl(document.getElementById('longUrl').value.trim()); }
    catch (error) { setMessage(error.message, 'error'); return; }
    button.disabled = true;
    button.innerHTML = 'Criando link <span class="spinner" aria-hidden="true"></span>';
    setMessage('Salvando seu link permanente…');
    try {
      const generated = await shorten(url);
      shortUrl.href = generated;
      shortUrl.textContent = generated.replace(/^https?:\/\//, '');
      destination.textContent = `Destino: ${url}`;
      resultCard.hidden = false;
      setMessage('Pronto! Seu link já pode ser compartilhado.', 'success');
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) { setMessage(error.message, 'error'); }
    finally { button.disabled = false; button.innerHTML = 'Encurtar link <span aria-hidden="true">→</span>'; }
  });
}

if (copyButton) {
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shortUrl.href);
      copyButton.textContent = 'Copiado ✓';
      setTimeout(() => { copyButton.textContent = 'Copiar'; }, 1800);
    } catch { setMessage('Não foi possível copiar automaticamente. Selecione e copie o link.', 'error'); }
  });
}

if (!configReady && message) setMessage('Quase pronto: conecte seu banco Supabase seguindo o README.');
redirectIfShortLink();
