# encurta.

Encurtador de links em português. O Cloudflare Worker serve o site, cria códigos curtos e redireciona os links; o Cloudflare D1 guarda os destinos permanentemente.

## Publicar no Cloudflare Workers

Pré-requisitos: uma conta Cloudflare e Node.js/npm instalados.

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/jetee01/teste-encurtador.git
   cd teste-encurtador
   npm install --save-dev wrangler
   npx wrangler login
   ```

2. Crie o banco D1:

   ```bash
   npx wrangler d1 create encurta-links
   ```

   Copie o `database_id` mostrado e substitua `SUBSTITUA_PELO_ID_DO_D1` em `wrangler.toml`.

3. Crie a tabela no banco remoto:

   ```bash
   npx wrangler d1 execute encurta-links --remote --file=./schema.sql
   ```

4. Publique o site e o Worker:

   ```bash
   npx wrangler deploy
   ```

   O comando exibirá o endereço `*.workers.dev`. A página e os links curtos ficam no mesmo domínio.

5. (Opcional) Para usar seu próprio domínio, abra **Workers & Pages → encurta-links → Settings → Domains & Routes** no painel Cloudflare e adicione um domínio/rota. O domínio precisa estar configurado na Cloudflare.

## Desenvolvimento local

Depois de preencher o `database_id` em `wrangler.toml`, inicialize o banco local e inicie o Worker:

```bash
npx wrangler d1 execute encurta-links --local --file=./schema.sql
npx wrangler dev
```

## Como funciona

- `POST /api/links` recebe `{ "url": "https://exemplo.com" }`, valida o endereço e grava um código aleatório de 7 caracteres no D1.
- `GET /CODIGO` procura o destino no D1 e responde com redirecionamento HTTP 302.
- Os links não expiram automaticamente. O site não usa Supabase nem precisa de configuração de chaves no navegador.
- A chave de operação é a variável `DB` configurada no binding D1 de `wrangler.toml`; não coloque credenciais secretas no frontend.

## Atenção para uso público

Qualquer visitante pode criar links, e os destinos são públicos por natureza. Antes de divulgar amplamente, considere adicionar rate limiting e controles contra abuso. Não encurte URLs privadas. O Cloudflare D1 tem limites e cotas que dependem do plano da sua conta.
