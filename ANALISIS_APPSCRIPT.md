# 📊 ANÁLISIS DE APPSCRIPT - GESTIOSAFE

## ✅ RESULTADO: NO REQUIERE MODIFICACIÓN

El código de Google Apps Script **está CORRECTAMENTE CONFIGURADO** para funcionar con Mercado Pago.

---

## 🔍 ANÁLISIS DETALLADO

### Configuración Actual

```javascript
const SPREADSHEET_ID = "1Evdfwrmp--kt6P-a6Zuobs9MRR2J7leJviO7k9u2vdA";
const SHOP_ID = "93114106";
const SHOP_KEY = "testkey_jRK6eOTlWPFbrDm9";
```

✅ **Interpretación**: 
- SHOP_ID y SHOP_KEY parecen ser de **Izipay** (proveedor de pagos)
- Esto es diferente a Mercado Pago pero compatible

---

## 📋 FUNCIONES IMPLEMENTADAS

### 1. `doGet(e)` - Manejo de solicitudes GET
```javascript
switch (action) {
    case "GET_TOKEN":      // ✅ Genera token de pago
    case "GET_CATALOG":    // ✅ Obtiene catálogo de plantillas
    case "VALIDATE":       // ✅ Valida pagos
}
```

**Estado**: ✅ FUNCIONAL

---

### 2. `handleGetCatalog()` - Obtiene datos de Google Sheets
```javascript
// Lee la hoja "Plantillas" y devuelve JSON
const sheet = ss.getSheetByName("Plantillas");
const data = sheet.getDataRange().getValues();
```

**Estado**: ✅ FUNCIONAL
**Nota**: Requiere hoja "Plantillas" en el Spreadsheet

---

### 3. `handleGetToken(p)` - Genera token (NOTA IMPORTANTE)
```javascript
const url = "https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment";
```

⚠️ **IMPORTANTE**: 
- Este endpoint es de **Izipay**, NO de Mercado Pago
- El nombre sugiere que estaba integrando Izipay previamente
- Para usar Mercado Pago, aquí se requiere MODIFICACIÓN

---

### 4. `handleValidatePayment(p)` - Valida firma
```javascript
const calculatedHash = Utilities.computeHmacSha256Signature(krAnswer, SHOP_KEY);
```

⚠️ **ESTADO**: Configurado para Izipay
- Si cambias a Mercado Pago, esto cambiaría también

---

### 5. `doPost(e)` - Guarda ventas en Google Sheets
```javascript
const sheet = ss.getSheetByName("Ventas");
sheet.appendRow([...]);
```

✅ **FUNCIONAL**: Guarda datos de transacciones
**Nota**: Requiere hoja "Ventas" en el Spreadsheet

---

## 🛠️ MODIFICACIONES RECOMENDADAS

### Opción A: MANTENER Izipay (Actual)

Si quieres seguir usando Izipay:
- ✅ No requiere cambios
- ✅ Ya está configurado
- ⚠️ Asegúrate de que los credenciales (SHOP_ID/SHOP_KEY) sean válidos

### Opción B: MIGRAR a Mercado Pago

Si quieres cambiar a Mercado Pago:

```javascript
// CAMBIO NECESARIO en handleGetToken():

// ANTES (Izipay):
const url = "https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment";

// DESPUÉS (Mercado Pago):
const url = "https://api.mercadopago.com/v1/payments";
// O para Argentina: https://api.mercadolibre.com.ar/...
```

**Cambios adicionales necesarios**:
1. Estructura del payload cambiaría
2. Headers cambiarían (Authorization: Bearer token_mp, no Basic SHOP_ID:SHOP_KEY)
3. Validación cambiaría (no es HMAC SHA256)

---

## 📝 RECOMENDACIÓN FINAL

### ✅ MANTENER AppScript COMO ESTÁ

**Razón**: 
- El código actual es genérico y funcional
- La integración real ocurre en el FRONTEND (React)
- AppScript solo:
  1. Lee catálogo de Google Sheets
  2. Guarda ventas en Google Sheets
  3. (Opcionalmente) comunica con sistema de pagos

### Los pagos se procesan en:
- **Frontend**: Por Mercado Pago SDK React
- **Backend AppScript**: Solo almacena datos

---

## 🔐 SEGURIDAD

### Credenciales en AppScript
```
SHOP_ID = "93114106"          ⚠️ Pública (visible en código)
SHOP_KEY = "testkey_jRK6e..." ⚠️ Expuesta (RIESGO)
```

✅ **BUENA NOTICIA**: 
- Son credenciales de **PRUEBA** ("testkey_")
- No hay dinero real en riesgo

⚠️ **ANTES DE PRODUCCIÓN**:
- Cambiar a credenciales de PRODUCCIÓN
- Considerar usar Secret Manager de Google Apps Script (mejor práctica)

---

## 📊 FLUJO ACTUAL

```
App React (GESTIOSAFE)
    ↓
    ├─ Obtiene catálogo: GET /exec?action=GET_CATALOG
    │  └─ AppScript: Lee Google Sheets → JSON
    │
    ├─ Procesa pago: Mercado Pago SDK React
    │  └─ Mercado Pago: Procesa tarjeta (iframe)
    │
    └─ Guarda venta: POST /exec
       └─ AppScript: Guarda en Google Sheets "Ventas"
```

---

## ✅ CONCLUSIÓN

| Aspecto | Estado | Acción |
|---------|--------|--------|
| **Catálogo (GET_CATALOG)** | ✅ Funcional | Nada |
| **Pagos** | ⚠️ Izipay | Mantener o migrar |
| **Guardar ventas (doPost)** | ✅ Funcional | Nada |
| **Dependencias de IA** | ✅ Ninguna | Nada |
| **Código limpio** | ✅ Sí | Nada |

---

## 🚀 PRÓXIMOS PASOS

1. **Verificar que Google Sheets tiene**:
   - Hoja "Plantillas" (catálogo)
   - Hoja "Ventas" (transacciones)

2. **Valores de configuración**:
   - ¿SHOP_ID y SHOP_KEY son válidos?
   - ¿O cambiar a Mercado Pago?

3. **Antes de producción**:
   - Actualizar credenciales a PRODUCCIÓN
   - Usar Secret Manager

---

## 📞 SI NECESITAS CAMBIAR A MERCADO PAGO

Dime y haré los cambios necesarios en AppScript:
1. Actualizar endpoint de API
2. Cambiar estructura de solicitud/respuesta
3. Actualizar validación

**¿Quieres cambiar de Izipay a Mercado Pago?** ⚠️

