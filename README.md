# GESTIOSAFE - E-Commerce de Plantillas Digitales

Plataforma de venta de plantillas digitales SST con integración de Mercado Pago.

## 🌐 Sitio Web
**https://www.gestiosafe.com**

---

## 📁 Estructura del Proyecto

```
GESTIOSAFE/
├── components/           # Componentes React
│   ├── CheckoutModal.tsx    # Modal de checkout con Mercado Pago
│   ├── PaymentCallback.tsx  # Manejo de retorno de pago
│   └── TemplateCard.tsx     # Tarjeta de producto
├── context/              # Contextos de React
│   └── CartContext.tsx      # Estado global del carrito
├── scripts/              # Scripts externos
│   └── GOOGLE_APPS_SCRIPT.js # Código para Google Apps Script
├── docs/                 # Documentación adicional
├── App.tsx               # Componente principal
├── config.ts             # Configuración centralizada
├── constants.ts          # Catálogo de plantillas (fallback)
├── types.ts              # Tipos TypeScript
├── index.html            # HTML principal
├── index.tsx             # Punto de entrada React
└── vercel.json           # Configuración de Vercel
```

---

## ⚙️ Configuración

### 1. Variables de Entorno (`.env.local`)
```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx
```

### 2. Config Principal (`config.ts`)
- `APPS_SCRIPT_URL` - URL del Google Apps Script desplegado
- `EXCHANGE_RATE` - Tipo de cambio USD → PEN
- `WHATSAPP_NUMBER` - Número de contacto

### 3. Google Apps Script
1. Ve a [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto
3. Copia el contenido de `scripts/GOOGLE_APPS_SCRIPT.js`
4. Despliega como "Aplicación web"
5. Actualiza la URL en `config.ts`

---

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

---

## 💳 Flujo de Pago

1. Usuario agrega productos al carrito
2. Completa formulario de checkout
3. Se crea preferencia en Mercado Pago (vía Apps Script)
4. Usuario completa pago en Mercado Pago
5. MP redirige a `www.gestiosafe.com` con parámetros
6. Se verifica el pago y se muestran los links de descarga

---

## 📊 Google Sheets

El Apps Script usa un Spreadsheet con estas hojas:
- **Plantillas** - Catálogo de productos
- **Ventas** - Registro de transacciones

---

## 🔧 Tecnologías

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Mercado Pago Checkout Pro
- Google Apps Script
- Vercel (hosting)

---

## 📞 Soporte

WhatsApp: +51 983 113 140

