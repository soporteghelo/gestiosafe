# 🎬 VIDEO-GUÍA EN TEXTO - Cómo Configurar Mercado Pago

## ESCENA 1: ¿Por qué no funcionaban los pagos?

```
┌─────────────────────────────────────────────────────────┐
│ EL PROBLEMA:                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  const MERCADOPAGO_PUBLIC_KEY = "TEST-516ba..."        │
│                                                         │
│  ❌ Esta clave NUNCA EXISTIÓ                           │
│  ❌ Mercado Pago rechaza solicitudes con ella          │
│  ❌ Por eso los pagos fallaban                         │
│                                                         │
│  SOLUCIÓN: Usar clave real de tu cuenta               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ESCENA 2: Obtener la clave correcta

```
PASO 1: Abre en tu navegador
═══════════════════════════════════════════════════════════
https://www.mercadopago.com.pe/developers/panel


PASO 2: Verás esto
═══════════════════════════════════════════════════════════
┌─────────────────────────────────────┐
│  Mi Cuenta                          │
│  ├─ Mis aplicaciones                │
│  ├─ Credenciales         ← AQUÍ     │
│  └─ Facturación                     │
└─────────────────────────────────────┘


PASO 3: Click en "Credenciales"
═══════════════════════════════════════════════════════════
Verás dos opciones:
  • Prueba (Sandbox) ← Para desarrollo
  • Producción      ← Para clientes reales


PASO 4: Para PRUEBAS (Sandbox)
═══════════════════════════════════════════════════════════
Click en "Prueba" y veras:

┌─────────────────────────────────────┐
│ CREDENCIALES DE PRUEBA              │
├─────────────────────────────────────┤
│ Clave Pública:                      │
│ APP_USR-a1b2c3d4e5f6g7h8i9j0k1l2   │ ← COPIA ESTO
│                                     │
│ Clave Privada:                      │
│ [Solo para backend]                 │
└─────────────────────────────────────┘


PASO 5: Copia solo la CLAVE PÚBLICA
═══════════════════════════════════════════════════════════
(La que empieza con APP_USR-)
```

---

## ESCENA 3: Configurar en tu proyecto

```
PASO 1: Abre el archivo .env.local
═══════════════════════════════════════════════════════════
En la carpeta raíz de GESTIOSAFE

Estructura de carpeta:
GESTIOSAFE/
├── components/
├── context/
├── .env.local        ← Este archivo
├── package.json
└── ...


PASO 2: Reemplaza el valor
═══════════════════════════════════════════════════════════

ANTES:
  VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-REEMPLAZA_CON_TU_CLAVE_PUBLICA

DESPUÉS (ejemplo):
  VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-a1b2c3d4e5f6g7h8i9j0k1l2m3


PASO 3: Guarda el archivo
═══════════════════════════════════════════════════════════
Ctrl+S (Windows/Linux) o Cmd+S (Mac)


PASO 4: Reinicia el servidor
═══════════════════════════════════════════════════════════
En la terminal:
  npm run dev

Deberías ver:
  VITE v6.2.0  ready in 123 ms
  ➜  Local:   http://localhost:3000/
```

---

## ESCENA 4: Probar un pago

```
PASO 1: Abre la app
═══════════════════════════════════════════════════════════
http://localhost:3000


PASO 2: Selecciona plantillas
═══════════════════════════════════════════════════════════
  • Busca cualquier plantilla
  • Haz click "Añadir al carrito"
  • Agrega 1 o 2 plantillas


PASO 3: Abre el Checkout
═══════════════════════════════════════════════════════════
Haz click en el botón de carrito (arriba)
Se abre un modal grande


PASO 4: Completa los datos
═══════════════════════════════════════════════════════════
  ├─ Nombres: Juan
  ├─ Apellidos: Pérez
  ├─ Email: juan@ejemplo.com
  ├─ DNI: 12345678
  └─ Teléfono: 987654321

(Pueden ser datos ficticios en pruebas)


PASO 5: Selecciona moneda
═══════════════════════════════════════════════════════════
  • Soles (S/) ← Recomendado para pruebas locales
  o
  • Dólares ($)


PASO 6: Haz click "Continuar al Pago"
═══════════════════════════════════════════════════════════
Debe pasar a STEP 2 (formulario de tarjeta)

Si ves error rojo:
  ❌ Revisa si configuraste .env.local
  ❌ Mira el Debug Console (abajo a la derecha)
  ❌ Lee DIAGNOSTICO_PAGOS.md


PASO 7: Verás el formulario de tarjeta
═══════════════════════════════════════════════════════════
┌──────────────────────────────────────┐
│ Mercado Pago                         │
│ PROCESANDO EN PEN                    │
├──────────────────────────────────────┤
│                                      │
│  Tarjeta de crédito o débito        │
│  [4444 4444 4444 4444]              │
│  [MM/AA] [CVV]                      │
│  [Nombre en la tarjeta]             │
│                                      │
│  [PAGAR]                            │
│                                      │
└──────────────────────────────────────┘


PASO 8: Ingresa datos de prueba
═══════════════════════════════════════════════════════════
Número: 4444 4444 4444 4444
Fecha:  12/26 (cualquier mes/año futuro)
CVV:    123 (cualquier número)
Nombre: Test User


PASO 9: Haz click en PAGAR
═══════════════════════════════════════════════════════════
Espera 2-3 segundos...


PASO 10: Resultado
═══════════════════════════════════════════════════════════
✅ ÉXITO:
   Ves STEP 3 con "¡Pago Exitoso!"
   Debug Console muestra: "🎉 PAGO APROBADO"

❌ ERROR:
   Ves mensaje de error
   Debug Console muestra: "❌ Pago rechazado"
   Lee el mensaje para saber por qué
```

---

## ESCENA 5: Entender el Debug Console

```
┌────────────────────────────────────────────────────────────┐
│ DEBUG CONSOLE - La terminal de la app                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 8:19:15 p. m. → SDK de Mercado Pago inicializado         │
│ 8:19:16 p. m. → Payment Brick listo                      │
│ 8:19:45 p. m. → 📨 Pago enviado: {...}                   │
│ 8:19:46 p. m. → 🔄 Enviando al backend...                │
│ 8:19:48 p. m. → ✅ Respuesta del backend: {...}          │
│ 8:19:48 p. m. → 🎉 PAGO APROBADO                         │
│                                                            │
└────────────────────────────────────────────────────────────┘

SIGNIFICADO DE EMOJIS:
═════════════════════════════════════════════════════════════
  ✅ OK: Todo bien, continuar
  ❌ ERROR: Algo salió mal
  ⚠️  AVISO: Posible problema
  📨 EVENTO: Algo importante pasó
  🔄 PROCESO: Esperando respuesta
  ⏳ PENDIENTE: En proceso
  🎉 ÉXITO: Operación completada
  → TIMESTAMP: Hora exacta del evento


VER EL DEBUG CONSOLE:
═════════════════════════════════════════════════════════════
En el Checkout modal, abajo a la derecha hay una caja negra:

┌─ DEBUG CONSOLE ──────────────┐
│ > ✅ SDK inicializado       │
│ > ⏳ Esperando pago...      │
│ > 📨 Pago enviado           │
│ > ✅ Respuesta backend      │
└─────────────────────────────┘

Scroll si hay muchos mensajes
```

---

## ESCENA 6: Tarjetas de prueba disponibles

```
¿SABÍAS QUE MERCADO PAGO TIENE MÚLTIPLES TARJETAS DE PRUEBA?

┌─────────────────┬──────────────────────────┬─────────────┐
│ Tipo            │ Número                   │ Resultado   │
├─────────────────┼──────────────────────────┼─────────────┤
│ VISA            │ 4444 4444 4444 4444      │ ✅ APROBADO │
│ Mastercard      │ 5555 5555 5555 4444      │ ✅ APROBADO │
│ American Express│ 3782 822463 10005        │ ✅ APROBADO │
│ Diners Club     │ 3714 496353 28025        │ ✅ APROBADO │
└─────────────────┴──────────────────────────┴─────────────┘

DATOS PARA TODAS:
═════════════════════════════════════════════════════════════
  Fecha: 12/26 (o cualquier fecha futura)
  CVV:  123 (o cualquier número)
  Nombre: Cualquiera (ej: TEST USER)

⚠️  IMPORTANTE:
    Estos números SOLO funcionan en Sandbox (Pruebas)
    Tarjetas reales NO funcionan en Sandbox
```

---

## ESCENA 7: Diferencia Sandbox vs Producción

```
┌────────────────────────────────────────────────────────┐
│ SANDBOX (Pruebas)          VS     PRODUCCIÓN (Real)    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ • Tarjetas ficticias       VS     • Tarjetas reales   │
│ • Dinero falso             VS     • Dinero real        │
│ • Clave: TEST-...          VS     • Clave: APP_USR-... │
│ • Para desarrollo          VS     • Para clientes     │
│                                                        │
│ ⚠️  No confundir claves!                              │
│    Si usas clave de PROD en DEV:                      │
│    Se cobrarán pagos REALES en TEST                   │
│                                                        │
└────────────────────────────────────────────────────────┘

EN ESTE MOMENTO:
═════════════════════════════════════════════════════════════
Estamos usando: SANDBOX (Pruebas)

Clave que necesitas:
  Panel MP → Credenciales → PRUEBA ← Aquí

Para cambiar a Producción después:
  Panel MP → Credenciales → PRODUCCIÓN ← Después
```

---

## ESCENA 8: ¿Qué hacer si no funciona?

```
ÁRBOL DE DECISIÓN:
═════════════════════════════════════════════════════════════

¿Veo formulario de tarjeta?
  │
  ├─ NO
  │  └─ ¿.env.local existe y configurado?
  │     ├─ NO  → Crea .env.local con clave
  │     └─ SÍ  → Reinicia: npm run dev
  │
  └─ SÍ
     └─ ¿El pago se aprobó?
        ├─ NO  → Mira Debug Console
        │       (la clave puede estar mal)
        └─ SÍ  → ¡Funciona! 🎉


CHECKS RÁPIDOS:
═════════════════════════════════════════════════════════════
1. ✅ .env.local existe? (ls -la .env.local)
2. ✅ VITE_MERCADOPAGO_PUBLIC_KEY tiene valor? (cat .env.local)
3. ✅ Valor comienza con APP_USR-? (no TEST-)
4. ✅ Reiniciaste servidor? (npm run dev)
5. ✅ Usas tarjeta 4444...? (no tarjeta real)
6. ✅ Miras Debug Console? (abajo a la derecha)


SI TODAVÍA NO FUNCIONA:
═════════════════════════════════════════════════════════════
1. Abre DevTools: F12
2. Ve a Console tab
3. Busca errores rojos
4. Lee DIAGNOSTICO_PAGOS.md
5. Lee MERCADOPAGO_SETUP.md
```

---

## 🎬 RESUMEN EN 30 SEGUNDOS

```
1. Obtén clave: https://www.mercadopago.com.pe/developers/panel
2. Edita .env.local: VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
3. Reinicia: npm run dev
4. Prueba con tarjeta 4444 4444 4444 4444
5. Listo! 🚀
```

---

## 🆘 CONTACTO

Si después de TODO esto no funciona:

📧 Mercado Pago Support:
   https://www.mercadopago.com.pe/developers/es/support/center

💬 Discord Comunidad:
   https://discord.com/invite/yth5bMKhdn

📖 Documentación completa:
   INICIO_RAPIDO.md
   MERCADOPAGO_SETUP.md
   DIAGNOSTICO_PAGOS.md
   RESUMEN_CAMBIOS.md

---

**¡Éxito! Si llegaste aquí, sabes más de integraciones que el 90% de desarrolladores 🏆**

