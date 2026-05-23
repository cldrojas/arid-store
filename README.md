# Arid Store 🏜️

**Tu tienda de poleras estampadas, lista en minutos.**

Arid Store es una plataforma de e-commerce lista para usar, diseñada para emprendedores y marcas de ropa que quieren vender poleras estampadas online sin complicaciones. Pensa en ella como tener una vitrina digital que funciona 24/7, lista para recibir pagos con MercadoPago y gestionar tus pedidos desde un panel sencillo.

---

## ¿Para quién es esto?

- **Emprendedores de moda** — que venden poleras estampadas y quieren su propia tienda online sin depender de Instagram o marketplace
- **Pequeñas marcas** — que necesitan un catálogo digital con tallas, colores y stock
- **Diseñadores** — que quieren vender sus diseños directamente al público

No necesitas saber de programación para usarla. Si puedes subir fotos y llenar formularios, puedes manejar Arid Store.

---

## ¿Qué problemas resuelve?

| Problema | Cómo lo resuelve Arid Store |
|----------|----------------------------|
| "No tengo tienda online" | Tienda completa con catálogo, carrito y checkout |
| "Los pagos son un lío" | Integración directa con MercadoPago — el cliente paga con débito, crédito o transferencia |
| "Pierdo el control del stock" | Panel admin con stock por talla y color, se descuenta automáticamente |
| "Mis clientes preguntan siempre lo mismo" | Cada producto tiene descripción, galería de imágenes y selector de variantes |
| "No sé si llegó el pedido" | El admin ve todos los pedidos con estado actualizado en tiempo real |

---

## Características principales

### Para tus clientes 🛍️
- Catálogo de productos con fotos, tallas y colores
- Carrito de compras que guarda lo que eligieron (aunque cierren el navegador)
- Pago seguro con MercadoPago (débito, crédito, prepago)
- Confirmación por email automática

### Para ti (el administrador) 👑
- Panel privado con estadísticas de ventas
- Gestión completa de productos (crear, editar, fotos, variantes)
- Vista de todos los pedidos con estado actualizado
- Control de stock por talla y color
- Marcado de pedidos como enviados/entregados

---

## Capturas (próximamente)

| Tienda | Catálogo | Admin |
|--------|----------|-------|
| *screenshot* | *screenshot* | *screenshot* |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Radix UI |
| Backend | Next.js App Router (Server Components + API Routes) |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) |
| Pagos | MercadoPago (CLP — sin decimales) |
| Emails | Resend + React Email |
| Despliegue | Vercel |

---

## Primeros pasos (desarrolladores)

```bash
# Clonar
git clone git@github.com:cldrojas/arid-store.git
cd arid-store

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales (Supabase, MercadoPago, Resend)

# Iniciar desarrollo
pnpm dev
```

### Requisitos
- Node.js 20+
- pnpm
- Cuenta en Supabase (gratuita)
- Cuenta en MercadoPago (para pagos)
- Cuenta en Resend (para emails)

### Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# MercadoPago
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=...
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=tienda@tudominio.com

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://xxxx.supabase.co/storage/v1/render/image/public
```

---

## Documentación técnica

Toda la documentación detallada está en la carpeta [`docs/`](./docs/):

| Documento | Contenido |
|-----------|-----------|
| [`docs/SPEC.md`](./docs/SPEC.md) | Especificación técnica completa: arquitectura, setup, API, migraciones, criterios de aceptación |

---

## Licencia

MIT
