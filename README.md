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
DB_NAME=valkiric

JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Valkiric <your-email@gmail.com>
```

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
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

La base de datos recomendada es Supabase PostgreSQL.

## Seguridad

- `.env` no debe subirse al repositorio
- Los secretos reales viven solo en variables de entorno del servidor
- Usa `.env.example` como plantilla pública
