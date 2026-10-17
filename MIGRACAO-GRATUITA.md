# Plano de migração gratuita do TireMax

## Preparação concluída localmente

- O frontend é uma SPA Vite; `frontend/public/_redirects` já contém o fallback de rotas necessário para Cloudflare Pages.
- `render.yaml` descreve a API Express como Web Service Free, com build, inicialização e health check.
- A API aceita apenas `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` e origens locais de desenvolvimento.
- Prisma separa `DATABASE_URL` (consultas da aplicação) e `DIRECT_URL` (migrations). Se `DIRECT_URL` não for informada, o start usa `DATABASE_URL` para manter compatibilidade com instalações existentes.
- A API agora para se faltar `DATABASE_URL` ou `JWT_SECRET`; o segredo público que estava como fallback foi removido.
- Logos usam Cloudflare R2 quando configurado, com upload em memória na produção e fallback em disco apenas no desenvolvimento local.

## Configuração por plataforma

### Neon (PostgreSQL)

Criar um projeto PostgreSQL e manter as duas URLs em segredo:

- `DATABASE_URL`: conexão pooled para consultas da API.
- `DIRECT_URL`: conexão direta para `prisma migrate deploy`.

Antes de importar qualquer dado, confirmar com o usuário a transferência dos registros de clientes, veículos, vendas, estoque, financeiro, usuários e notas fiscais do PostgreSQL Railway para o projeto Neon identificado. O banco contém dados pessoais e comerciais. O plano gratuito atual do Neon inclui até 1 GB por projeto; confirmar o tamanho real antes da importação.

### Render (API)

Conectar o repositório `RobersonCodes/Tiremax` como Blueprint a partir do `render.yaml`. Informar `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL` e `CORS_ALLOWED_ORIGINS`. O Render gera `JWT_SECRET` no primeiro provisionamento. `RESEND_API_KEY` e `FOCUS_NFE_TOKEN` são opcionais para e-mail e emissão fiscal.

O serviço gratuito dorme após 15 minutos sem requisições; a primeira chamada seguinte pode demorar cerca de um minuto. Não usar disco local para arquivos permanentes.

### Cloudflare Pages (frontend)

- Root directory: `frontend`
- Build command: `npm run build`
- Build output: `dist`
- Variável de build `VITE_API_URL`: URL pública da API Render, sem `/api` no final.

Depois do primeiro deploy, testar o endereço `pages.dev` antes de associar domínio.

## Pendências antes do corte de tráfego

1. A origem foi identificada: projeto Railway `beautiful-wonder`, serviço `Tiremax` e serviço `Postgres`; ambos estão offline porque o período de teste expirou. A Vercel `VITE_API_URL` continua como Secret e não pode ser revelada.
2. A tela Backups do Postgres mostra um backup existente chamado `Pre-Security-Patch Backup`, de 219 MB, criado há cerca de um mês, sem agenda de backups. A documentação do Railway informa que dados em volumes de Trial são apagados 30 dias após a expiração dos créditos. Prioridade: preservar a base já. A restauração do Railway cria um volume substituto no mesmo serviço, mantém o volume anterior desanexado e exige Deploy para aplicar; avaliar custo/limites da conta antes de aplicar.
3. Transferir os registros do PostgreSQL para Neon só após confirmação específica do usuário sobre os dados e o destino; não importar dados nesta etapa. Confirmar também o tamanho atual da base, pois 219 MB é o tamanho do backup, não uma prova do tamanho da base atual.
4. O suporte a logos no Cloudflare R2 já foi preparado localmente. Ainda é necessário criar o bucket, emitir uma chave restrita a esse bucket e configurar `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_PUBLIC_URL` no Render. Em produção, o app bloqueia o upload se o armazenamento persistente não estiver configurado.
5. Conectar Cloudflare, Render e Neon, configurar as variáveis secretas e validar health check, login, dados, e-mail e uploads. Os dashboards Cloudflare, Render e Neon pediram login durante a preparação.
6. Só então configurar os registros DNS na Hostinger e trocar o domínio. Manter a hospedagem atual sem alterações até a validação final.

## Estado observado no Railway

- Projeto `beautiful-wonder` (ID `7f5d508e-f58f-47b1-8c55-a7dcaeb8ff35`).
- Serviço `Tiremax` conectado a `RobersonCodes/Tiremax`, diretório `backend`, branch `main`; domínio público atual `tiremax-production.up.railway.app` na porta 8080.
- Serviço `Postgres` offline, com volume persistente anexado.
- O schema identifica a tabela de clientes como `clients`, mas nenhum total pôde ser consultado enquanto o Postgres está offline.
- Quando o banco estiver acessível, o total por empresa pode ser obtido sem ler dados pessoais com: `SELECT t.name, COUNT(c.id) AS clientes FROM tenants t LEFT JOIN clients c ON c.tenant_id = t.id GROUP BY t.id, t.name;`.
- Há duas alterações de variáveis de e-mail preparadas na interface do Railway (`EMAIL_FROM` e uma chave de API). Elas não foram aplicadas nem implantadas.
- A preparação está no commit local `073a448` da branch `codex/free-hosting-deploy`; ainda não foi enviada ao GitHub. O conector de GitHub recusou a criação da branch por falta de permissão de escrita, e o Git local não tem uma sessão autenticada para publicar.
- Nenhuma configuração externa foi alterada durante esta preparação.

## Arquivos preparados

- `render.yaml`
- `backend/src/app.js`
- `backend/start.js`
- `backend/prisma/schema.prisma`
- exemplos de ambiente e preparação do setup de testes
- `frontend/public/_redirects` já existia no repositório
