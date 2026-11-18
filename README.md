# Gaming Zone Manager (Next.js)

PS5 station board, prepaid customer wallets, automatic play-time billing, admin dashboard and superadmin branch control.
Customer portal is not included (as per scope).

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure
- `app/login` role picker (demo login)
- `app/(app)/board | customers | history | dashboard | stations | tenants` role pages inside the sidebar shell; employees and admins choose per-minute, 30-minute, or hourly billing, wallet funds are automatically applied at session end, and any remainder is payable at checkout; admins manage station rates
- Separate `loans`, `expenses`, and `revenue` pages keep customer credit, operating costs, and earned game/cafe sales distinct; admin and employee expenses are stored in separate ledgers
- Employees and admins can record expenses, convert unpaid session checkouts to customer loans, repay loans, and place paid cafe orders; employee cafe stock is read-only
- Admin inventory manages equipment, games and cafe stock
- `lib/store.jsx` demo data store (localStorage) and billing logic: 30-minute rates include 5 minutes grace, hourly rates include 10 minutes grace, and subsequent blocks are charged in 30-minute increments; each session keeps its starting rates
- `components/` Shell, Modal/Icons, TopUp

## Connecting a real backend
Replace the actions in `lib/store.jsx` with calls to your Express/MySQL API
(`/api/sessions/start`, `/api/wallet/topups`, ...). Billing must be calculated on the server;
the browser timer is display only. Add tenant_id scoping, idempotency keys and an append-only ledger there.
