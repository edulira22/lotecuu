# Reglas para Claude Code — proyecto LoteCUU

Este archivo lo lee Claude Code automáticamente. Define el contexto y las reglas que debe seguir al trabajar en este repo.

## Contexto

LoteCUU es una vitrina de autos usados en Chihuahua, México. Conecta lotes/vendedores con compradores vía WhatsApp directo. Stack target: **Next.js 15 + TypeScript + Tailwind + Supabase + Vercel**.

Las pantallas y comportamientos están definidos en `/design_handoff_lotecuu/`. Léelos antes de implementar cualquier feature.

## Reglas no negociables

1. **Idioma**: toda la UI en español (es-MX). Nada de mezcla. Variables y código siempre en inglés, copy en español.
2. **Regla de oro**: cualquier campo opcional (precio, km, año, color, etc.) se omite silenciosamente si no hay dato. Nunca mostrar "N/A" o "—" en el feed/ficha públicos.
3. **WhatsApp es el único canal de contacto público**. Usar `https://wa.me/<phone>?text=<encoded>`. No crear formularios que escriban a la DB.
4. **Sin login para compradores**. Solo vendedores y admin necesitan auth (Supabase magic link).
5. **Tipografía**: Manrope, pesos 400 / 500 / 600. Nunca 700/bold.
6. **Color naranja `#E56A2E`** se usa SOLO para: precio, CTA principal, indicador activo. No para fondos grandes ni decoración.
7. **Bordes**: 0.5px hairlines (`border: 0.5px solid var(--gray-line)`).
8. **Status pills**: solo 3 estados — `available` (verde), `reserved` (ámbar), `sold` (gris atenuado).

## Patrones técnicos

- **Componentes**: server components por default; `"use client"` solo donde se necesite estado/interactividad (galería, filtros, admin).
- **Data fetching**: server-side con Supabase server client. Nunca fetch desde cliente para listados públicos.
- **Imágenes**: siempre `next/image` con `sizes` apropiado. Bucket público en Supabase Storage.
- **Slugs**: kebab-case `toyota-hilux-2022`. Generar con `slugify()` al crear el auto.
- **Precios**: enteros en MXN sin decimales. Format con `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })`.
- **Fechas**: `date-fns` con locale `es`.
- **Forms admin**: `react-hook-form` + `zod`.

## Cómo trabajar features

Cuando te pida implementar algo:
1. Lee primero `design_handoff_lotecuu/README.md` para entender el diseño completo
2. Mira el archivo `.jsx` correspondiente (feed.jsx, ficha.jsx, etc.) para ver el layout exacto
3. Recrea el diseño en Next.js usando los patrones del proyecto, no pegues el JSX
4. Los design tokens en `styles.css` ya deben estar mapeados en `tailwind.config.ts`

## Comandos útiles

```bash
pnpm dev                    # desarrollo local
pnpm build                  # build prod
pnpm typecheck              # verificar tipos
pnpm db:types               # regenerar tipos de Supabase
```

## Estructura objetivo

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                        # redirect a /autos
│   │   ├── autos/page.tsx                  # Feed
│   │   ├── autos/[slug]/page.tsx           # Ficha
│   │   └── vendedores/[slug]/page.tsx      # Perfil vendedor
│   ├── admin/
│   │   ├── layout.tsx                      # protected
│   │   ├── inventario/page.tsx
│   │   ├── perfil/page.tsx
│   │   └── mensajes/page.tsx
│   └── layout.tsx                          # root, fuente Manrope
├── components/
│   ├── ui/                                 # primitivos: Button, Status, Avatar, Icon
│   ├── feed/                               # CarCard, FilterBar, Hero
│   ├── ficha/                              # SpecGrid, SellerCard, FilmstripGallery
│   ├── seller/                             # SellerHero, StatsBar
│   └── admin/                              # forms, table
├── lib/
│   ├── supabase/                           # clients (server, browser, admin)
│   ├── format.ts                           # fmtPrice, fmtKm, slugify
│   └── whatsapp.ts                         # buildWhatsAppLink(phone, text)
└── styles/globals.css                      # CSS vars
```

## Antes de cada commit

- `pnpm typecheck` debe pasar
- Lighthouse mobile score > 90 en feed y ficha
- Status pills se ven correctamente en los 3 estados
- Galería filmstrip funciona con drag, click, teclado y resize
