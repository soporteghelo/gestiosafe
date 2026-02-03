# 💱 TIPO DE CAMBIO Y MONEDAS - GESTIOSAFE

## 📌 Configuración Actual

El tipo de cambio se configura en `config.ts`:

```typescript
export const EXCHANGE_RATE = 3.75;
```

## 🔄 Flujo de Conversión

### 1. **Frontend (CheckoutModal.tsx)**
- Los productos están en **USD** en la base de datos
- Cuando el usuario selecciona **PEN**:
  - `precio_pen = precio_usd * EXCHANGE_RATE`
  - Ejemplo: $10 USD × 3.75 = S/ 37.50
- Cuando el usuario selecciona **USD**:
  - `precio_usd = precio_usd` (sin conversión)

### 2. **Backend (GOOGLE_APPS_SCRIPT.js)**
- Recibe el monto **ya convertido** del frontend
- Crea la preferencia de Mercado Pago con:
  - `currency_id`: "PEN" o "USD"
  - `unit_price`: el monto recibido del frontend

## ⚠️ IMPORTANTE: Sandbox vs Producción

### **Mercado Pago Sandbox (Pruebas)**
- **PEN en Sandbox**: Mercado Pago aplica su propio tipo de cambio (~3.36)
- **Recomendación**: Para pruebas, usar **USD** para evitar conversiones automáticas
- El tipo de cambio interno de MP Sandbox no se puede modificar

### **Mercado Pago Producción**
- **PEN en Producción**: Funciona correctamente
- Mercado Pago acepta el precio en PEN tal como se envía
- El tipo de cambio de `config.ts` se respeta completamente

## 🌎 Pagos Internacionales

### Clientes que pagan en USD
- ✅ **Funcionará correctamente**
- Si el cliente elige USD:
  - Ve precios en dólares
  - Paga en dólares
  - No hay conversión de moneda
- Mercado Pago soporta pagos internacionales en USD

### Clientes que pagan en PEN
- ✅ **Solo para clientes en Perú**
- El cliente verá precios en soles
- Pagará en soles
- Conversión aplicada: EXCHANGE_RATE de `config.ts`

## 🔧 Cómo Actualizar el Tipo de Cambio

1. Edita `config.ts`:
```typescript
export const EXCHANGE_RATE = 3.80; // Nuevo tipo de cambio
```

2. Haz commit y push:
```bash
git add config.ts
git commit -m "chore: actualizar tipo de cambio a 3.80"
git push
```

3. Vercel desplegará automáticamente

## 🧪 Pruebas en Sandbox

### Opción 1: Probar en USD (Recomendado)
- Selecciona "USD" en el checkout
- Usa tarjetas de prueba de Mercado Pago
- El monto será exacto sin conversiones

### Opción 2: Probar en PEN (con diferencia)
- Selecciona "PEN" en el checkout
- **El monto puede diferir** por el tipo de cambio interno de MP
- Ejemplo:
  - Tu config: 3.75
  - MP Sandbox: 3.36
  - Diferencia: ~10%
- En producción **no habrá esta diferencia**

## 📊 Ejemplo de Cálculo

Producto: **Matriz IPERC** - $10 USD

| Moneda | Cálculo | Precio Final |
|--------|---------|--------------|
| USD | $10.00 | **$10.00** |
| PEN (config=3.75) | $10 × 3.75 | **S/ 37.50** |
| PEN Sandbox (MP=3.36) | $10 × 3.36 | S/ 33.60 ⚠️ |

## ✅ Resumen

- **Config.ts**: Controla el tipo de cambio en tu app
- **Sandbox PEN**: Tiene tipo de cambio fijo de MP (~3.36)
- **Producción PEN**: Respeta tu tipo de cambio (3.75)
- **USD**: Funciona igual en sandbox y producción
- **Clientes internacionales**: Pueden pagar en USD sin problema
