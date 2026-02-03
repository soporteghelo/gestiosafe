// ============================================
// CONFIGURACIÓN CENTRALIZADA DE GESTIOSAFE
// ============================================

// URL de Google Apps Script - CAMBIA SOLO AQUÍ
// Después de hacer una nueva implementación en Apps Script, actualiza esta URL
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzD8JnuhYhvhxCgNwuqDYRkxzVlu_uQc03TcNtkn-q0Qv9vLZc1CR0nmzAXWIKmpmxSCw/exec";

// Mercado Pago Public Key
export const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || "APP_USR-NOT_CONFIGURED";

// ============================================
// 💱 TIPO DE CAMBIO USD → PEN
// Modifica este valor según el tipo de cambio actual
// ============================================
export const EXCHANGE_RATE = 3.75;

// ============================================
// 🏷️ DESCUENTO PROMOCIONAL
// Cambia este valor para activar descuentos (0 = sin descuento)
// Ejemplo: 10 = 10% de descuento, 25 = 25% de descuento
// ============================================
export const DISCOUNT_PERCENT = 0;

// Nombre de la promoción (aparece cuando DISCOUNT_PERCENT > 0)
export const PROMO_NAME = "🔥 BLACK FRIDAY";

// Mensaje promocional corto
export const PROMO_MESSAGE = "¡Oferta por tiempo limitado!";

// ============================================
// 📞 CONTACTO
// ============================================
export const WHATSAPP_NUMBER = "51983113140";

