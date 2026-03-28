# IbaSocial3

Aplicacao Next.js para cadastro de pedidos sociais, triagem automatica e acompanhamento operacional.

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`
- `DASHBOARD_ACCESS_KEY` para proteger a area interna do dashboard

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

## Fluxo atual

- Cadastro publico multietapas
- Gravacao em Google Sheets com campos de prioridade e status
- Dashboard interno com filtros por rede, celula, periodo e status
- Exportacao CSV e atualizacao de observacoes internas
