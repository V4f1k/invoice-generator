# Invoice Generator

Monorepo aplikace pro generování faktur s Next.js frontend a Express.js API.

## 📋 Požadavky

- Node.js 18+ 
- PostgreSQL databáze
- npm 10.5.0+

## 🚀 Rychlý start

### 1. Instalace závislostí

```bash
npm install
```

### 2. Nastavení databáze

API vyžaduje PostgreSQL databázi. Ujistěte se, že máte běžící PostgreSQL na portu 5432.

### 3. Konfigurace prostředí

API konfigurace je v `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invoice_generator_dev?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
PORT=3002
FRONTEND_URL="http://localhost:3001"
```

### 4. Generování Prisma klienta

```bash
npx prisma generate --schema=apps/api/prisma/schema.prisma
```

### 5. Spuštění aplikace

```bash
npm run dev
```

Toto spustí oba servery současně pomocí Turbo:
- **Web aplikace (Next.js)**: http://localhost:3001
- **API server (Express)**: http://localhost:3002

## 📁 Struktura projektu

```
invoice-generator/
├── apps/
│   ├── web/          # Next.js frontend aplikace
│   └── api/          # Express.js backend API
├── packages/         # Sdílené balíčky
├── turbo.json        # Turbo konfigurace
└── package.json      # Root package.json s workspaces
```

## 🔧 Dostupné příkazy

- `npm run dev` - Spustí vývojové servery
- `npm run build` - Build produkční verze
- `npm run lint` - Spustí linting
- `npm run test` - Spustí testy

## 🐛 Řešení problémů

### API server se neustále restartuje
- Zkontrolujte, zda jste vygenerovali Prisma klienta: `npx prisma generate --schema=apps/api/prisma/schema.prisma`

### CORS/Network Error
- Ujistěte se, že FRONTEND_URL v `apps/api/.env` odpovídá portu, na kterém běží Next.js (obvykle 3001)

### Port 3000 je obsazen
- Next.js automaticky použije port 3001, pokud je 3000 obsazen

### Chybějící dependencies
- Smaž `node_modules` a znovu instaluj: `rm -rf node_modules apps/*/node_modules && npm install`

## 🔐 API Endpoints

- `GET /health` - Health check
- `POST /api/v1/auth/register` - Registrace
- `POST /api/v1/auth/login` - Přihlášení
- `GET /api/v1/auth/logout` - Odhlášení
- Další endpointy vyžadují autentizaci

## 💻 Technologie

- **Frontend**: Next.js 15.5.2, React 19, TypeScript, Tailwind CSS, Turbopack
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL
- **Monorepo**: Turbo, npm workspaces
