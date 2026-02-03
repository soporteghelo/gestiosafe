# 🔍 DIAGNÓSTICO Y FAQ - PROBLEMAS DE PAGO

## ¿Por qué no funcionaban los pagos antes?

### Problema #1: Clave Pública Inválida ❌
```
Clave usada: TEST-516ba562-4799-4d07-9cd0-eaf8cd3eb311
Problema: Esta clave NO EXISTE en Mercado Pago
```

**Solución**: Obtener clave real de tu panel:
```
https://www.mercadopago.com.pe/developers/panel → Credenciales
```

---

### Problema #2: CardPayment vs Payment Brick ❌
El código usaba `CardPayment` que es para **tokens solamente**, no para pagos completos.

**Solución**: Cambiar a `Payment` Brick que maneja el flujo completo.

---

### Problema #3: Sin Inicialización del SDK ❌
```typescript
// ANTES (incorrecto):
useEffect(() => {
    if (publicKey) {
        initMercadoPago(publicKey, { locale: 'es-PE' });
    }
}, [publicKey]);
```

**Solución**: Agregar validaciones y manejo de errores:
```typescript
// DESPUÉS (correcto):
useEffect(() => {
    if (!publicKey || publicKey.includes("YOUR_PUBLIC_KEY")) {
        setInitError("Configura tu clave pública");
        return;
    }
    try {
        initMercadoPago(publicKey, { locale: 'es-PE' });
        setIsInitialized(true);
    } catch (error) {
        setInitError(error.message);
    }
}, [publicKey]);
```

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [ ] Tengo cuenta en Mercado Pago
- [ ] He iniciado sesión en https://www.mercadopago.com.pe/developers/panel
- [ ] He copiado mi clave pública (APP_USR-...)
- [ ] He creado archivo `.env.local` con `VITE_MERCADOPAGO_PUBLIC_KEY`
- [ ] He reiniciado el servidor: `npm run dev`
- [ ] Veo el formulario de pago sin errores
- [ ] Uso tarjeta de prueba: `4444 4444 4444 4444`
- [ ] El Debug Console muestra logs correctos

---

## 🎮 PRUEBAS PASO A PASO

### Paso 1: Verificar configuración
```bash
# En la terminal, verifica que .env.local existe:
cat .env.local
# Debe mostrar: VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
```

### Paso 2: Ver el Debug Console
En la app, en el Checkout modal:
1. Completa el formulario de datos
2. Click "Continuar al Pago"
3. Mira el Debug Console en la parte inferior derecha
4. Debe mostrar: `✅ SDK de Mercado Pago inicializado`

### Paso 3: Intentar pago
1. Verás formulario de tarjeta
2. Ingresa: `4444 4444 4444 4444`
3. Fecha: `12/26`
4. CVV: `123`
5. Nombre: `Test User`
6. Click "Pagar"

### Paso 4: Ver resultado en Debug Console
- Si ✅: "🎉 PAGO APROBADO"
- Si ❌: "❌ Pago rechazado: [razón]"

---

## 🆘 SOLUCIONAR PROBLEMAS

### Error: "Clave Pública No Configurada"

**Causa**: `VITE_MERCADOPAGO_PUBLIC_KEY` no está en `.env.local`

**Solución**:
```bash
# 1. Abre o crea .env.local en la raíz del proyecto
# 2. Agrega esta línea:
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-clave-aqui

# 3. Guarda
# 4. Reinicia: npm run dev
```

---

### Error: "Mercado Pago SDK Error"

**Causa**: La clave pública es inválida o de otra cuenta

**Solución**:
1. Ve a https://www.mercadopago.com.pe/developers/panel
2. Verifica que iniciaste sesión
3. Busca "Credenciales" en el menú
4. Para PRUEBAS: usa clave de "Prueba" (Sandbox)
5. Para PRODUCCIÓN: usa clave de "Producción"
6. Copia la CLAVE PÚBLICA exactamente (debe empezar con `APP_USR-`)

---

### Error: "Tarjeta Rechazada"

**En Sandbox (Pruebas)**:
- Todas las tarjetas de prueba funcionan
- Si falla: Verifica que usas clave de PRUEBA (no producción)

**En Producción**:
- Solo tarjetas REALES funcionan
- Verifica que el monto sea correcto
- Que no haya límites de la tarjeta

---

### Error: "Network Error" o "CORS Error"

**Causa**: El backend (Google Apps Script) no responde

**Solución**:
1. Verifica que Google Apps Script está deployado
2. URL debe ser: `https://script.google.com/macros/s/AKfycbz...`
3. El endpoint debe tener `/exec` al final
4. Debe aceptar `GET` o `POST`

---

## 🧪 TARJETAS DE PRUEBA SANDBOX

Estas SOLO funcionan con clave de PRUEBA:

| Tipo | Número | Resultado |
|------|--------|-----------|
| VISA | 4444 4444 4444 4444 | Aprobado ✅ |
| Mastercard | 5555 5555 5555 4444 | Aprobado ✅ |
| Amex | 3782 822463 10005 | Aprobado ✅ |
| Diners | 3714 496353 28025 | Aprobado ✅ |

**Para todas**:
- Fecha: Cualquier fecha futura (ej: 12/26)
- CVV: Cualquier número (ej: 123)
- Nombre: Cualquier texto (ej: TEST USER)

---

## 📊 FLUJO DE DATOS CORRECTO

```
Usuario llena formulario
        ↓
Click "Continuar al Pago"
        ↓
SDK MP inicializado ✅
        ↓
Payment Brick renderizado ✅
        ↓
Usuario ingresa tarjeta
        ↓
Click "Pagar"
        ↓
onSubmit enviado a backend ✅
        ↓
Backend procesa en MP API
        ↓
Respuesta aprobado/rechazado
        ↓
Mostrar Step 3 (éxito) o error
```

---

## 📞 CONTACTOS

- **Mercado Pago Support**: https://www.mercadopago.com.pe/developers/es/support/center
- **Discord Mercado Pago**: https://discord.com/invite/yth5bMKhdn
- **Status Page**: https://status.mercadopago.com/

---

## ✅ CÓMO SABER QUE ESTÁ FUNCIONANDO

Estos signos indican que todo está bien:

1. ✅ Debug Console muestra: `SDK de Mercado Pago inicializado`
2. ✅ Aparece formulario de tarjeta correctamente
3. ✅ Los campos aceptan entrada
4. ✅ El botón "Pagar" no está deshabilitado
5. ✅ Debug Console muestra "Pago enviado: ..."
6. ✅ Backend responde (visible en Network tab)
7. ✅ Resultado aparece (aprobado/rechazado)

Si alguno de estos falta, revisa el Debug Console para más detalles.

