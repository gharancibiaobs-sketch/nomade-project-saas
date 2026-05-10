# Nomade Project SaaS

Aplicacion SaaS B2B editorial para catalogo, carrito y backoffice administrativo sobre Supabase.

## Ejecutar

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env` y agrega tus credenciales de Supabase. Si no hay credenciales, la app usa datos demo para permitir revisar la experiencia visual.

## Supabase

Ejecuta `supabase/schema.sql` en el SQL Editor de Supabase. Crea los buckets publicos desde ese script y ajusta la regla `is_admin()` segun el metadata de tus usuarios administradores.
