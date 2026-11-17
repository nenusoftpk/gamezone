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
- `app/(app)/board | customers | history | dashboard | stations | tenants` role pages inside the sidebar shell; employees can choose wallet or checkout billing and settle session bills on the live board
- Admin finance tracks expenses and customer credit, and admin inventory manages equipment, games and cafe stock
- `lib/store.jsx` demo data store (localStorage) and all billing logic: cost = elapsed hours x rate snapshot
- `components/` Shell, Modal/Icons, TopUp

## Connecting a real backend
Replace the actions in `lib/store.jsx` with calls to your Express/MySQL API
(`/api/sessions/start`, `/api/wallet/topups`, ...). Billing must be calculated on the server;
the browser timer is display only. Add tenant_id scoping, idempotency keys and an append-only ledger there.
