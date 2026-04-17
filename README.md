# Consumer First Moving Survey

Browser-first moving survey passport platform.

## Current stack
- Next.js
- TypeScript
- Tailwind CSS
- Prisma

## Current scaffold status
This repository currently contains:
- research and product docs in the repo root
- initial app scaffold in `src/`
- placeholder survey and mover routes
- Prisma baseline schema
- auth and storage decision placeholders

## Local development
1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env.local
```

3. Generate Prisma client:

```bash
npx prisma generate
```

4. Start the app:

```bash
npm run dev
```

## Notes
- Auth is not wired yet.
- Storage is not wired yet.
- Initial scaffold is intentionally lean so the build can move quickly.
