# Guía de Google Apps Script

## Configuración Inicial

### 1. Crear el proyecto
1. Ve a https://script.google.com
2. Clic en "Nuevo proyecto"
3. Nombra el proyecto: "GESTIOSAFE Backend"

### 2. Copiar el código
1. Abre el archivo `scripts/GOOGLE_APPS_SCRIPT.js`
2. Copia TODO el contenido
3. Pégalo en el editor de Apps Script (reemplaza todo)

### 3. Configurar variables
En el código, actualiza:
```javascript
const SPREADSHEET_ID = "TU_ID_DE_SPREADSHEET";
const MP_ACCESS_TOKEN = "TU_ACCESS_TOKEN_DE_MERCADOPAGO";
```

### 4. Desplegar
1. Clic en "Implementar" > "Nueva implementación"
2. Tipo: "Aplicación web"
3. Ejecutar como: "Yo"
4. Acceso: "Cualquiera"
5. Clic en "Implementar"
6. Copia la URL generada

### 5. Actualizar Frontend
Pega la URL en `config.ts`:
```typescript
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/xxx/exec";
```

---

## Estructura del Spreadsheet

### Hoja: Plantillas
| Columna | Descripción |
|---------|-------------|
| A | ID |
| B | Nombre |
| C | Descripción |
| D | Precio USD |
| E | Categoría |
| F | URL Imagen |
| G | Link de descarga |
| H | Tipos de archivo |

### Hoja: Ventas
| Columna | Descripción |
|---------|-------------|
| A | Fecha |
| B | Payment ID |
| C | Preference ID |
| D | Cliente |
| E | Email |
| F | Items |
| G | Total |
| H | Moneda |
| I | Estado |

---

## Acciones Disponibles (API)

| Acción | Descripción |
|--------|-------------|
| `GET_CATALOG` | Obtiene catálogo de plantillas |
| `CREATE_MP_PREFERENCE` | Crea preferencia de Mercado Pago |
| `VERIFY_BY_PAYMENT_ID` | Verifica pago por ID |
| `TEST_REGISTRO` | Prueba de registro en Sheets |

---

## Solución de Problemas

### Error: "SPREADSHEET_ID already declared"
- Asegúrate de copiar el código COMPLETO
- No debe haber código duplicado

### Error: "No se puede acceder al Spreadsheet"
- Verifica que el ID sea correcto
- El Spreadsheet debe ser del mismo usuario que despliega

### Error de CORS
- La respuesta siempre debe ser JSON
- Usa `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)`
