const form = document.getElementById('shortenForm');
const message = document.getElementById('formMessage');
const button = document.getElementById('shortenButton');
const resultCard = document.getElementById('resultCard');
const shortUrl = document.getElementById('shortUrl');
const destination = document.getElementById('destination');
const copyButton = document.getElementById('copyButton');

if (document.getElementById('year')) document.getElementById('year').textContent = new Date().getFullYear();

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
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o link. Tente novamente.');
      const generated = new URL(`/${data.slug}`, location.origin).href;
      shortUrl.href = generated;
      shortUrl.textContent = generated.replace(/^https?:\/\//, '');
      destination.textContent = `Destino: ${url}`;
      resultCard.hidden = false;
      setMessage('Pronto! Seu link já pode ser compartilhado.', 'success');
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) { setMessage(error.message || 'Erro de conexão. Tente novamente.', 'error'); }
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
