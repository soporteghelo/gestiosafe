<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🛒 GESTIOSAFE - E-Commerce de Plantillas SST

Plataforma de e-commerce especializada en plantillas de **Seguridad y Salud en el Trabajo (SST)** para empresas en Perú.

## ✨ Características

- 🎨 Catálogo completo de plantillas SST
- 🛒 Carrito de compras funcional
- 💳 Pagos integrados con Mercado Pago
- 🔍 Búsqueda y filtros avanzados
- 📱 Diseño responsive (mobile-first)
- 🚀 Built con React 19 + TypeScript + Vite

---

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Mercado Pago ⚠️ IMPORTANTE

```bash
cp .env.example .env.local
# Edita .env.local y agrega tu clave pública
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-clave-aqui
```

Obtén tu clave en: https://www.mercadopago.com.pe/developers/panel

### 3. Ejecutar desarrollo

```bash
npm run dev
```

---

## 📋 Documentación

| Documento | Propósito |
|-----------|-----------|
| [INICIO_RAPIDO.md](INICIO_RAPIDO.md) | 3 pasos para empezar |
| [MERCADOPAGO_SETUP.md](MERCADOPAGO_SETUP.md) | Setup detallado |
| [DIAGNOSTICO_PAGOS.md](DIAGNOSTICO_PAGOS.md) | Troubleshooting |

---

## 🧪 Pruebas

Tarjeta de prueba (Sandbox):
- Número: `4444 4444 4444 4444`
- Fecha: 12/26
- CVV: 123

---

## 🏗️ Estructura

```
src/
├── components/
│   ├── CheckoutModal.tsx
│   └── ImprovedPaymentCheckout.tsx  ✨ NUEVO
├── context/CartContext.tsx
└── App.tsx
```

---

## 🔒 Seguridad

✅ Clave de MP en `.env.local` (no en código)
✅ Validación de credenciales
✅ Sanitización de datos

---

## 🆘 ¿Problemas?

1. Verifica `.env.local` configurado
2. Abre DevTools (F12)
3. Lee [DIAGNOSTICO_PAGOS.md](DIAGNOSTICO_PAGOS.md)

---

**¡Listo para vender! 🚀**

