# ⚡ SOLUCIÓN RÁPIDA - PAGOS GESTIOSAFE

## 🎯 TL;DR - Haz esto ahora:

### 1. Obtén tu clave de Mercado Pago
```
https://www.mercadopago.com.pe/developers/panel
→ Credenciales
→ Copia la CLAVE PÚBLICA (empieza con APP_USR-)
```

### 2. Abre `.env.local` (en la raíz del proyecto) y reemplaza:
```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-AQUI-VA-TU-CLAVE-COPIADA
```

### 3. Reinicia el servidor:
```bash
npm run dev
```

### 4. Prueba con esta tarjeta:
```
Número: 4444 4444 4444 4444
Fecha: 12/26 (o cualquier fecha futura)
CVV: 123
Nombre: Test User
```

---

## ✅ Signos de que funciona:

1. El formulario de tarjeta aparece sin errores rojos
2. El Debug Console (abajo a la derecha) dice: ✅ "SDK de Mercado Pago inicializado"
3. Puedes ingresar datos de tarjeta
4. Al hacer clic en "Pagar", ves logs en el Debug Console
5. Ves "🎉 PAGO APROBADO" o "❌ Pago rechazado"

---

## ❌ Si ves este error:

**"Clave Pública No Configurada"**

→ Sigue los 4 pasos de arriba (se que lo dice, pero es importante 😄)

---

## 🆘 Soporte rápido:

| Problema | Solución |
|----------|----------|
| No veo formulario de pago | Verifica .env.local configurado |
| "Tarjeta Rechazada" | ¿Usas clave de PRUEBA? (no producción) |
| No sé qué pasó | Abre Debug Console (parte inferior del modal) |
| Necesito ayuda | Lee DIAGNOSTICO_PAGOS.md o MERCADOPAGO_SETUP.md |

---

## 📚 Documentación completa:

- `MERCADOPAGO_SETUP.md` - Guía detallada de configuración
- `DIAGNOSTICO_PAGOS.md` - FAQ y troubleshooting
- `RESUMEN_CAMBIOS.md` - Qué cambió y por qué

---

**¡Eso es todo! El resto es automático 🚀**

