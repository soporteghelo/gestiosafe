# 🚀 GESTIOSAFE - E-Commerce de Plantillas Digitales SST

**GESTIOSAFE** es una plataforma web moderna para la venta y descarga de plantillas digitales de Seguridad y Salud en el Trabajo (SST), dirigida a empresas y profesionales que buscan soluciones listas para usar en gestión documental, reportes, matrices y formatos legales.

---

## 🛒 Funcionalidades Principales

| Característica                | Descripción                                                                 |
|-------------------------------|-----------------------------------------------------------------------------|
| Compra y descarga inmediata   | Plantillas premium (Excel, Word, PDF, PPT)                                  |
| Pagos 100% seguros            | Integración Mercado Pago Checkout Pro                                       |
| Catálogo filtrable            | Por sector, categoría y tipo de archivo                                     |
| Links de descarga protegidos  | Solo disponibles tras pago verificado                                       |
| Diseño responsive             | Experiencia optimizada en móvil y desktop                                   |
| Backend serverless            | Google Apps Script + Google Sheets                                          |
| Despliegue automático         | Vercel conectado a GitHub                                                   |

---

## 🌐 Sitio Web
**[www.gestiosafe.com](https://www.gestiosafe.com)**

---

## 🗂️ Estructura del Proyecto

```text
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

| Tecnología                | Uso Principal                        |
|---------------------------|--------------------------------------|
| React 19 + TypeScript     | Frontend                             |
| Vite                      | Bundler y servidor de desarrollo     |
| Tailwind CSS              | Estilos y diseño                     |
| Mercado Pago Checkout Pro | Pagos online                         |
| Google Apps Script        | Backend serverless                   |
| Google Sheets             | Base de datos                        |
| Vercel                    | Hosting y despliegue automático      |
| GitHub                    | Control de versiones                 |

---

## 🌐 Dominio y Configuración

Este proyecto utiliza el dominio personalizado **gestiosafe.com** comprado en [GoDaddy.com](https://www.godaddy.com) con la cuenta:
- **Email:** sergiolozanogarcia1@gmail.com
- **Contraseña:** Logan2025$

### Pasos para la configuración del dominio en GoDaddy:
1. **Compra del dominio:**
   - Se adquirió el dominio gestiosafe.com desde la cuenta indicada en GoDaddy.
2. **Acceso a la gestión de DNS:**
   - Ingresar a GoDaddy y seleccionar el dominio comprado.
   - Ir a la sección "Administrar DNS".
3. **Configuración de registros para Vercel:**
   - En Vercel, agregar el dominio gestiosafe.com al proyecto.
   - Copiar los registros DNS que Vercel indica (tipo A y CNAME).
   - En GoDaddy, crear/editar los registros:
     - **A**: Apuntar a la IP de Vercel (por ejemplo, 76.76.21.21)
     - **CNAME**: Apuntar a cname.vercel-dns.com
4. **Propagación:**
   - Esperar hasta 24 horas para que los cambios de DNS se propaguen globalmente.
5. **Verificación en Vercel:**
   - Vercel detecta automáticamente el dominio y activa el certificado SSL (https).
6. **Pruebas finales:**
   - Acceder a https://www.gestiosafe.com y verificar que la web carga correctamente y el candado de seguridad aparece.

---

## 🔗 Conexión Vercel + GitHub

El despliegue automático está configurado en [Vercel](https://vercel.com) y conectado al repositorio de GitHub:
- **Cuenta GitHub:** soporte.ghelo@gmail.com
- Cada push a `main` en GitHub actualiza la web en Vercel automáticamente.

---

## 📞 Soporte

- WhatsApp: [+51 983 113 140](https://api.whatsapp.com/send/?phone=51983113140&text=Quiero+informaci%C3%B3n+sobre+Gestiosafe)
- Email: app@loganqehs.com

---

## 📝 Licencia

MIT

---

## 💰 Análisis de Costo y Precio de Venta

| Modalidad                | Precio estimado (USD)         |
|--------------------------|-------------------------------|
| Desarrollo personalizado | $2,000 - $4,000               |
| Plataforma lista (one-off)| $1,200 - $2,000               |
| Licencia anual (SaaS)    | $300 - $600 / año              |
| SaaS mensual             | $40 - $80 / mes                |

**Factores que influyen:**
- Calidad visual y experiencia de usuario
- Seguridad y pagos reales
- Backend serverless (sin servidores propios)
- Dominio y hosting incluidos
- Soporte y mantenimiento

**Precio recomendado:**
- Venta única: $1,500 - $2,500 USD (instalación y dominio incluidos)
- SaaS mensual: $40 - $80 USD/mes (con soporte y actualizaciones)

