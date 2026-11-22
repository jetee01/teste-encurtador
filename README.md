# encurta.

Um encurtador de links responsivo em português, com URLs permanentes armazenadas no Supabase e redirecionamento pelo GitHub Pages.

## Configuração do banco (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No painel do projeto, abra **SQL Editor**, cole o conteúdo de `schema.sql` e execute.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon/public**.
4. Edite `config.js` e substitua `SUPABASE_URL` e `SUPABASE_ANON_KEY` pelos valores do seu projeto. A chave `anon` é pública e pode ficar no frontend; as políticas RLS do SQL limitam as operações às necessárias para o encurtador.
5. Publique o repositório em **Settings → Pages**, escolhendo a branch `main` e a pasta `/ (root)`.

O endereço curto usa o próprio domínio do GitHub Pages, no formato `https://jetee01.github.io/teste-encurtador/CODIGO`. Se publicar em outro endereço ou domínio, ajuste `APP_BASE_PATH` em `config.js` e a tag `<base>` de `404.html` para o caminho base do site (use `/` para domínio configurado na raiz).

## Uso e notas

- Links são criados com códigos aleatórios de sete caracteres e guardados no banco; não expiram automaticamente.
- `404.html` trata as rotas curtas no GitHub Pages e consulta o destino no Supabase.
- Os links e destinos são públicos por definição. Não use para guardar URLs privadas.
- Para uso público em escala, adicione rate limiting, proteção contra abuso e monitoramento com uma Edge Function ou API. As políticas abertas permitem que visitantes anônimos criem links.
- O site não funciona plenamente até configurar o Supabase e publicar o schema.
