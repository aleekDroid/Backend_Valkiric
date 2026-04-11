# Valkiric Backend

API REST para Valkiric construida con NestJS 10, TypeORM y PostgreSQL.

## Stack

- NestJS 10
- TypeORM 0.3
- PostgreSQL
- JWT
- Nodemailer para 2FA por correo

## Requisitos

- Node.js 20 o superior
- npm 9 o superior
- PostgreSQL 14 o superior

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run seed
npm run start:dev
```

API local: `http://localhost:3000`

## Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

BREVO_API_KEY=your-brevo-api-key
SMTP_FROM=Valkiric <verified-sender@example.com>

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-login
SMTP_PASS=your-brevo-smtp-key
```

Para producción en Railway, se recomienda usar la API HTTPS de Brevo y no SMTP.
La API usa el puerto 443 y evita los timeouts de salida SMTP vistos en Railway.
La variable `BREVO_API_KEY` se obtiene en Brevo desde `SMTP & API` > `API Keys`.
La variable `SMTP_FROM` debe usar un remitente verificado en Brevo.
Las variables SMTP quedan como fallback opcional para otros entornos.

## Scripts

- `npm run start:dev` inicia la API en modo watch
- `npm run build` compila a `dist/`
- `npm run start:prod` ejecuta la build de producción
- `npm run seed` carga datos demo

## Deploy recomendado

### Railway

Configura el repo con root directory en `backend/` y estas variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`
- `NODE_ENV=production`
- `FRONTEND_URL`
- `BREVO_API_KEY`
- `SMTP_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_CONNECTION_TIMEOUT=15000`
- `SMTP_GREETING_TIMEOUT=10000`
- `SMTP_SOCKET_TIMEOUT=20000`

La base de datos recomendada es Supabase PostgreSQL.

## Seguridad

- `.env` no debe subirse al repositorio
- Los secretos reales viven solo en variables de entorno del servidor
- Usa `.env.example` como plantilla pública
