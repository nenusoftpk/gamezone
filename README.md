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

## Superadmin authentication (MongoDB)
Superadmin sign-in is verified against a MongoDB account. Branch records, plans, license payments, public downloads, demo videos, and platform audit entries are stored in MongoDB. Branch admin credentials are hashed and verified against MongoDB; employee demo accounts and branch operational data remain in browser localStorage.

1. Copy `.env.example` to `.env.local`.
2. Set `SUPERADMIN_PASSWORD` to a unique password with at least 12 characters.
3. Replace `AUTH_SECRET` with a random value of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Ensure MongoDB is running locally, or set `MONGODB_URI` to your MongoDB connection string.
5. Restart the Next.js server. The first superadmin login creates the MongoDB account with a bcrypt-hashed password; later logins use the stored account. The first platform visit migrates the existing browser's branch, plan, payment, resource, audit, and branch-admin data into MongoDB. Subsequent superadmin page updates use MongoDB as the source of truth.

The MongoDB auth session is stored in an HTTP-only cookie and protects superadmin platform routes. Superadmin and branch-admin password changes are saved in MongoDB. This migration does not move customers, stations, sessions, employees, or other branch operational data out of localStorage.

The Employee and Admin demo buttons use `DEMO_EMPLOYEE_USERNAME`, `DEMO_EMPLOYEE_PASSWORD`, `DEMO_ADMIN_USERNAME`, and `DEMO_ADMIN_PASSWORD` from the server environment. These credentials are returned to the public login page to support the demo buttons, so configure demo-only credentials and do not use real staff credentials.

## Connecting a real backend
Replace the actions in `lib/store.jsx` with calls to your Express/MySQL API
(`/api/sessions/start`, `/api/wallet/topups`, ...). Billing must be calculated on the server;
the browser timer is display only. Add tenant_id scoping, idempotency keys and an append-only ledger there.
