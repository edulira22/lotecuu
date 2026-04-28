# Handoff: LoteCUU — Marketplace de autos usados (Chihuahua)

## Overview

LoteCUU es una vitrina digital de autos usados en Chihuahua, México. Conecta lotes/vendedores locales con compradores a través de WhatsApp directo (sin formularios intermedios). Esta entrega contiene los diseños de alta fidelidad de las cuatro pantallas principales:

1. **Feed** (`/autos`) — listado público con filtros
2. **Ficha** (`/autos/[slug]`) — detalle de un auto, con galería tipo carrete fílmico
3. **Perfil del vendedor** (`/vendedores/[slug]`) — cada lote con su propia identidad de marca
4. **Panel admin** (`/admin`) — gestión de inventario e identidad por el vendedor

El objetivo de este paquete es que un desarrollador (o Claude Code) pueda tomar estos diseños y construir la versión funcional en producción.

## About the Design Files

Los archivos `.html` y `.jsx` adjuntos son **referencias de diseño creadas con HTML + React in-browser (Babel standalone)**. Son prototipos para mostrar la estética, layout e interacciones esperadas — **no son código de producción para copiar al pie de la letra**.

La tarea consiste en **recrear estos diseños en un stack real** (recomendación abajo), siguiendo los patrones de la plataforma elegida, no en pegar el JSX existente. La lógica visual (gradientes, sprites SVG, gallery filmstrip) sí puede portarse casi 1:1.

## Fidelity

**Alta fidelidad.** Los colores, tipografía, espaciados, radios, estados (Disponible / Apartado / Vendido) y comportamientos (hover, drag de la galería, sticky CTA mobile, navegación entre pantallas) están definidos. Las **fotos de autos son placeholders SVG estilizados**: deben reemplazarse por fotografía real subida por el vendedor desde el panel admin.

## Stack recomendado

Sugerencia para construir el producto real:

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Estilos**: Tailwind CSS con tokens custom (mapear las CSS vars de `styles.css`) o CSS Modules
- **DB**: Supabase (Postgres + Storage para fotos + Auth)
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **Imágenes**: `next/image` con storage en Supabase
- **WhatsApp**: links `https://wa.me/<phone>?text=<encoded>` — no requiere API
- **i18n**: solo español, locale `es-MX`

Razones: Vercel + Supabase cubren el MVP gratis, Next.js permite SSR para SEO (clave para que los autos aparezcan en Google), y `next/image` resuelve el peso de las galerías.

## Screens / Views

### 1. Feed (`/autos`)

**Propósito**: punto de entrada. El comprador navega autos disponibles y abre la ficha de los que le interesan.

**Layout desktop (1280px)**:
- Navbar sticky 76px (logo 48px + nav + botones derecha)
- Hero `#1E232B` 56px padding, h1 52px peso 500, search pill, stats abajo
- FilterBar sticky 64px abajo del navbar, scroll horizontal de chips
- Grid 3 columnas (gap 16px) — la tarjeta `featured` ocupa 2 columnas
- Footer oscuro

**Layout mobile (390px)**:
- Navbar 50px (logo 36 + menú)
- Hero más compacto (32px h1, padding 32/18)
- FilterBar scrollable
- Grid 1 columna

**Componentes**: `Navbar`, `Hero`, `FilterBar`, `SortBar`, `CarCard`, `Footer`

**Reglas críticas**:
- "Regla de oro": cualquier campo opcional (precio, km, año, color, fuel, etc.) **se omite silenciosamente** si no hay dato. Una tarjeta sin precio muestra "Consultar precio" en gris; sin km no muestra el chip.
- Orden: `featured` primero → `available` → `reserved` → `sold` (atenuado a 60% opacity)
- Sold cars: CTA cambia a "Ver ficha" (ghost), no WhatsApp
- Filtros disponibles: Todos · Sedán · SUV · Pickup · Camioneta · Automático · Manual · ★ Destacados · Hasta $200k · 2020 o más nuevo

### 2. Ficha (`/autos/[slug]`)

**Propósito**: convencer al comprador de contactar por WhatsApp.

**Layout desktop**:
- Topbar sticky con back, logo central, share
- Grid `1.4fr 1fr` con gap 40px
- Izquierda: galería filmstrip (460px alto)
- Derecha: status pills, h1 30px, precio 34px naranja, CTA WhatsApp grande, specs grid 2 col, descripción quote, **SellerCard con stripe de marca**
- Abajo (full width): "Más autos de [vendedor]" — grid 3 col

**Layout mobile**:
- Topbar fina
- Galería full-bleed 280px
- Info column con padding 18px, padding-bottom 120px (deja espacio al sticky)
- Sticky bottom: precio + botón WhatsApp pequeño

**Galería filmstrip — INTERACCIÓN CLAVE**:
Ver sección dedicada abajo.

**SellerCard** (la card del vendedor en la ficha):
- Stripe gradient de marca arriba (4px alto, `${logoColor} → ${logoAccent}`)
- `SellerLogo` mark 48px + nombre del lote en color de marca + ubicación
- Rating "★ 4.8 · 142 reseñas · 12 años"
- Botón ghost "WhatsApp del vendedor"
- Link "Ver todos sus autos →" navega a `/vendedores/[slug]`

### 3. Perfil del vendedor (`/vendedores/[slug]`)

**Propósito**: que cada lote se sienta como su propia marca dentro de LoteCUU.

**Layout desktop**:
- Topbar fina (back + logo LoteCUU centrado)
- Hero 52px padding con `linear-gradient(135deg, logoColor → logoColor+dd → logoAccent+66)` — cada lote tiene su gradient
- Logo del lote sobre placa blanca redondeada (96px), badge "Vendedor verificado", h1 46px, tagline, botón "Contactar lote" en blanco
- StatsBar (Inventario / Vendidos / Calificación / Antigüedad) — 4 columnas
- Grid `1fr 320px` debajo:
  - Izquierda: tabs (Todos / Disponibles / Apartados / Vendidos) + grid 3 col de inventario
  - Sidebar derecha: descripción, contacto (ubicación, WhatsApp, horario), botón CTA

**Layout mobile**:
- Hero stacked vertical
- StatsBar 2x2
- Tabs scrollables
- Grid 2 col de inventario
- Info abajo, no sidebar

### 4. Panel admin (`/admin`)

**Propósito**: el vendedor sube y edita su info + autos. **Intencionalmente simple** — no se profundizó en este pase.

**Layout desktop**:
- Sidebar 240px oscura (`#1E232B`) con logo del lote arriba + tabs (Inventario / Mi perfil / Mensajes)
- Tab activa con `rgba(229,106,46,0.18)` background y texto `#FCAE7A`
- Main: tabla de inventario con miniatura + título + estado + año + precio + Editar

**Tab Inventario**: tabla con `gridTemplateColumns: '64px 1.6fr 1fr 110px 120px 90px'`, header gris claro

**Tab Mi perfil**: 2 columnas (Identidad + Contacto), inputs simples, botón "Cambiar logo"

**Tab Mensajes**: placeholder ("los mensajes llegan a tu WhatsApp directo, próximamente historial")

**Mobile**: sidebar se vuelve barra horizontal arriba.

## Interacciones & Behavior

### Galería filmstrip (la interacción especial)

Ubicada en `gallery.jsx`, componente `FilmstripGallery`. Es la interacción más distintiva del producto.

**Características**:
- Las fotos se montan en una "tira" horizontal que se desliza con `transform: translateX()` y transición `cubic-bezier(.2,.8,.2,1) 0.55s`
- La foto activa va al centro a tamaño completo (720px desktop / 320px mobile)
- Las fotos vecinas se ven peeking desde los lados (110px desktop / 38px mobile), con `filter: saturate(0.45) brightness(0.65)` y `scale(0.96)` + vignette radial
- Bandas de **sprocket holes** (perforaciones de cinta) arriba y abajo, hechas con `repeating-linear-gradient`, sobre fondo `#0E1218`
- **Drag horizontal**: pointer events; si dx > 18% de stride, avanza al siguiente
- **Click**: en cualquier frame visible va al centro
- **Teclado**: ArrowLeft / ArrowRight con tabIndex 0
- **Indicador progresivo abajo**: barritas 4px, la activa expande a 28px naranja, transición 0.3s
- Counter monospace arriba: "Carrete · 02 de 05" + placa
- Tunnels gradient en los bordes (solo desktop): refuerzan la sensación cinematográfica

**Implementación recomendada en producción**:
- Usar **Framer Motion** o `embla-carousel-react` para la base, y agregar la decoración custom (sprockets, vignette, peek) por encima
- O reimplementar 1:1 — el código en `gallery.jsx` está aislado y portable
- Asegurar `touch-action: pan-y` para no bloquear scroll vertical en mobile
- Lazy-load fotos (next/image)

### Otras interacciones

- **Feed → Ficha**: click en card abre detalle (en producción: `<Link href={`/autos/${slug}`}>`)
- **Ficha → Vendedor**: link "Ver perfil completo" navega a `/vendedores/[seller-id]`
- **Vendedor → Ficha**: click en auto del inventario va a `/autos/[slug]`
- **WhatsApp CTA**: prefill mensaje `Hola, vi el ${title} en LoteCUU. ¿Sigue disponible?` → `https://wa.me/${phoneStripped}?text=${encodeURIComponent(msg)}`
- **Hover en CarCard**: borde `gray-line` → `gray-line-strong`
- **Sticky mobile en ficha**: `position: sticky; bottom: 0` con `box-shadow: 0 -10px 24px rgba(30,35,43,0.06)`

## State Management

Mínimo necesario por pantalla:

- **Feed**: `filter` (chip activo), eventualmente sort + búsqueda + paginación
- **Ficha**: galería tiene su `active` index local
- **Vendedor**: `tab` (all/available/reserved/sold)
- **Admin**: `tab` (inventory/profile/messages) + estado de formularios (recomendado `react-hook-form` + Zod)

**Datos remotos** (Supabase queries):
- `cars` con joins a `sellers`
- `sellers` individual
- `cars_by_seller` para perfil
- Mutations: crear/editar auto, editar perfil, subir logo y fotos a Storage

## Design Tokens

Todos están en `styles.css` como CSS variables. Se mapean directo a Tailwind o CSS-in-JS.

```css
--bg-primary:        #FAFAF7  /* warm off-white */
--bg-secondary:      #ECEFF3  /* chip background */
--bg-dark:           #1E232B  /* hero, footer, admin sidebar */
--text-primary:      #1E232B
--text-muted:        #5F5E5A
--gray-mid:          #AEB7C2
--gray-line:         rgba(30, 35, 43, 0.08)
--gray-line-strong:  rgba(30, 35, 43, 0.14)

--orange:            #E56A2E  /* CTA, precio, acento */
--orange-soft:       #FCE9DD
--orange-deep:       #B14E1F  /* hover */

--teal:              #255C7A  /* secundario, links */
--teal-soft:         #DCE8EE

/* Status pills */
--status-green-bg:   #EAF3DE   --status-green-fg: #3B6D11
--status-amber-bg:   #FAEEDA   --status-amber-fg: #854F0B
--status-gray-bg:    #F1EFE8   --status-gray-fg:  #5F5E5A

--whatsapp:          #25D366
--whatsapp-deep:     #128C7E

/* Radii */
--radius-card:       12px
--radius-chip:       8px
--radius-pill:       999px

/* Type */
--font:  'Manrope', 'DM Sans', system-ui, sans-serif
/* Pesos usados: 400, 500, 600 (NO bold/700) */
```

**Tipografía**: Manrope. Letter-spacing -0.005em base, -0.02em en h1. text-wrap: pretty donde aplique.

**Espaciado**: múltiplos de 4 — 4, 8, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 56, 64

**Bordes**: 0.5px hairlines (no 1px). Aceptan que se vean como 1px en pantallas no-retina.

**Sombras**: muy sutiles. La principal es la del sticky CTA mobile: `0 -10px 24px rgba(30,35,43,0.06)`. Y la del logo en hero del vendedor: `0 12px 40px rgba(0,0,0,0.18)`.

## Modelo de datos sugerido (Supabase)

```sql
-- sellers
create table sellers (
  id text primary key,           -- slug e.g. 'autos-lira'
  name text not null,
  initials text,
  tagline text,
  description text,
  location text,
  phone text,
  whatsapp text,
  hours text,
  logo_url text,                 -- subido al Storage
  logo_color text default '#1E232B',
  logo_accent text default '#E56A2E',
  rating numeric,
  review_count int default 0,
  years_active int,
  verified boolean default false,
  created_at timestamptz default now()
);

-- cars
create table cars (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  seller_id text references sellers(id),
  title text not null,
  trim text,
  price int,                      -- en MXN, sin decimales
  year int,
  km int,
  transmission text,              -- 'Automático' | 'Manual'
  type text,                      -- 'Sedán' | 'SUV' | 'Pickup' | ...
  fuel text,
  color text,
  condition text,
  status text default 'available', -- 'available' | 'reserved' | 'sold'
  featured boolean default false,
  plate text,
  description text,
  created_at timestamptz default now()
);

-- car_photos
create table car_photos (
  id uuid primary key default gen_random_uuid(),
  car_id uuid references cars(id) on delete cascade,
  url text not null,
  position int default 0,
  created_at timestamptz default now()
);
```

## Assets

- `assets/logo-transparent.png` — logo principal (símbolo + wordmark stacked) — única versión usada actualmente
- `assets/logo-dark-bg.png`, `logo-light-bg.png`, `logo-symbol.png`, `logo-mark.png` — variantes de respaldo
- **Fotos de autos**: placeholders SVG generados (`CarPlaceholder` en `lib.jsx`). Reemplazar por upload real desde el admin → Supabase Storage.
- **Logos de vendedores**: actualmente generados como SVG (`SellerLogo` en `lib.jsx`, con `logoStyle: shield/badge/monogram`). Reemplazar por subida real desde el admin.
- **Iconos**: SVG inline en componente `Icon` (lib.jsx). Migrar a `lucide-react` en producción.
- **Tipografía**: Manrope desde Google Fonts.

## Files (referencia)

| Archivo | Qué tiene |
|---|---|
| `LoteCUU.html` | Entry point — define el design canvas con todos los artboards |
| `styles.css` | Todos los design tokens y utilidades (.lc-btn, .lc-card, .lc-status, etc.) |
| `lib.jsx` | Componentes compartidos: `Logo`, `LogoMark`, `SellerLogo`, `CarPlaceholder`, `Status`, `FeaturedPill`, `Avatar`, `Icon`. Datos mock: `CARS`, `SELLERS`. Helpers: `fmtPrice`, `fmtKm`, `getSeller` |
| `feed.jsx` | `FeedScreen`, `Navbar`, `Hero`, `FilterBar`, `SortBar`, `CarCard` |
| `ficha.jsx` | `FichaScreen`, `SpecGrid`, `SellerCard`, `MiniCard` |
| `gallery.jsx` | `FilmstripGallery` — la galería tipo carrete |
| `seller.jsx` | `SellerScreen`, `SellerHero`, `StatsBar`, `ContactBlock`, `SellerInventoryCard` |
| `admin.jsx` | `AdminScreen`, `AdminField` |
| `design-canvas.jsx` | Wrapper de presentación — NO portar a producción, es solo para el handoff visual |

## Roadmap sugerido para Claude Code

1. **Bootstrap del proyecto**
   - `npx create-next-app@latest lotecuu --typescript --tailwind --app`
   - Configurar Manrope en `app/layout.tsx`
   - Mapear todos los CSS vars de `styles.css` a `tailwind.config.ts` (theme.extend.colors)

2. **Setup Supabase**
   - Crear proyecto en supabase.com
   - Correr el SQL de arriba
   - Crear bucket `cars` y `sellers` en Storage (público)
   - Generar tipos: `npx supabase gen types typescript`

3. **Pantallas (en orden)**
   - Feed: SSR con `cars` ordenados por featured + status. `<Link>` a fichas.
   - Ficha: SSG/ISR por slug. Portar `FilmstripGallery` (el código de `gallery.jsx` es portable casi 1:1, ajustar imports).
   - Vendedor: SSR/SSG por slug.
   - Admin: ruta protegida con Supabase Auth (magic link). Form con react-hook-form + Zod. Subida de imágenes con `supabase.storage.upload()`.

4. **Polish**
   - SEO: og:image dinámico por auto (Vercel OG), JSON-LD `Vehicle` schema
   - Sitemap dinámico desde Supabase
   - Analytics: Vercel Analytics o Plausible
   - PWA opcional para "agregar a home screen"

5. **Publicar**
   - Push a `github.com/edulira22/lotecuu`
   - Conectar a Vercel
   - Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Dominio custom (lotecuu.mx o similar)

## Notas finales

- **Regla de oro**: cualquier campo opcional se omite silenciosamente. No mostrar "Sin precio" gigante; mostrar "Consultar precio" pequeño y gris, o no mostrar la fila en la ficha.
- **WhatsApp es el contrato**: nunca crear formularios de contacto que envíen al backend. Todo va por `wa.me/`.
- **Identidad por vendedor**: el `logoColor` y `logoAccent` de cada seller deben aplicarse en el hero de su perfil y en la stripe de su SellerCard. Es lo que hace que el sitio se sienta como "muchas marcas dentro de una marca paraguas".
- **Escala mobile real**: hit targets ≥ 44px. La galería filmstrip ya cumple. Verificar todos los botones de filtro y nav.

Suerte 🚗
