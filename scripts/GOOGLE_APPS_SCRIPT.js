
// ============================================
// GESTIOSAFE - GOOGLE APPS SCRIPT
// CON LOGS DETALLADOS PARA DEBUGGING
// Versión: 2.0 - Febrero 2026
// ============================================

const SPREADSHEET_ID = "1Evdfwrmp--kt6P-a6Zuobs9MRR2J7leJviO7k9u2vdA";
const MP_ACCESS_TOKEN = "TEST-7737746752799435-020210-2c5bcc69ed889fe5591a8fb92b47868a-3176203752";

function doGet(e) {
  const p = e.parameter;
  const action = p.action;

  Logger.log("========== NUEVA PETICIÓN ==========");
  Logger.log("Fecha: " + new Date().toISOString());
  Logger.log("Action: " + action);
  Logger.log("Parámetros: " + JSON.stringify(p));

  try {
    switch (action) {
      case "GET_CATALOG":
        return handleGetCatalog();
      
      case "CREATE_MP_PREFERENCE":
        return handleCreateMPPreference(p);
      
      case "VERIFY_PAYMENT":
        return handleVerifyPayment(p);
      
      case "VERIFY_BY_PAYMENT_ID":
        return handleVerifyByPaymentId(p);
      
      case "TEST_REGISTRO":
        return testRegistroVenta(p);
      
      case "PROCESS_CARD_PAYMENT":
        return handleProcessCardPaymentGET(p);
      
      default:
        Logger.log("❌ Acción no reconocida: " + action);
        return jsonResponse({
          status: "ERROR",
          message: "Acción no especificada o inválida: " + action,
          availableActions: ["GET_CATALOG", "CREATE_MP_PREFERENCE", "VERIFY_PAYMENT", "VERIFY_BY_PAYMENT_ID", "TEST_REGISTRO"]
        });
    }
  } catch (error) {
    Logger.log("❌ ERROR GENERAL: " + error.toString());
    Logger.log("Stack: " + error.stack);
    return jsonResponse({
      status: "ERROR",
      message: error.toString()
    });
  }
}

function jsonResponse(data) {
  Logger.log("📤 Respuesta: " + JSON.stringify(data));
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// TEST: Simular registro de venta exitoso
// Llama con: ?action=TEST_REGISTRO&email=test@test.com
// O ejecuta directamente desde el editor
// ==========================================
function testRegistroVenta(p) {
  Logger.log("=== 🧪 TEST REGISTRO VENTA ===");
  
  // Si p es undefined (ejecución desde editor), crear objeto vacío
  if (!p) {
    p = {};
    Logger.log("⚠️ Ejecutando desde editor (sin parámetros URL)");
  }
  
  try {
    Logger.log("1️⃣ Abriendo Spreadsheet...");
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log("✅ Spreadsheet abierto: " + ss.getName());
    
    // Buscar o crear hoja Ventas
    Logger.log("2️⃣ Buscando hoja 'Ventas'...");
    let sheet = ss.getSheetByName("Ventas");
    
    if (!sheet) {
      Logger.log("📝 Hoja 'Ventas' no existe, creándola...");
      sheet = ss.insertSheet("Ventas");
      sheet.appendRow([
        "Fecha",
        "Payment ID",
        "Preference ID",
        "Cliente",
        "Email",
        "Items",
        "Total",
        "Moneda",
        "Estado"
      ]);
      Logger.log("✅ Hoja 'Ventas' creada con encabezados");
    } else {
      Logger.log("✅ Hoja 'Ventas' encontrada");
    }
    
    // Registrar venta de prueba
    Logger.log("3️⃣ Insertando fila de prueba...");
    const testData = [
      new Date(),
      "TEST-" + Date.now(),
      "PREF-TEST-" + Date.now(),
      (p && p.customer_name) ? p.customer_name : "Cliente Test",
      (p && p.email) ? p.email : "test@test.com",
      (p && p.items) ? p.items : "Producto de Prueba",
      (p && p.total) ? p.total : "100.00",
      (p && p.currency) ? p.currency : "PEN",
      "✅ APROBADO (TEST)"
    ];
    
    sheet.appendRow(testData);
    Logger.log("✅ Fila de prueba agregada exitosamente");
    Logger.log("Datos: " + JSON.stringify(testData));
    
    return jsonResponse({
      status: "SUCCESS",
      message: "✅ Registro de prueba creado exitosamente. Revisa la hoja 'Ventas' en tu Spreadsheet.",
      data: testData,
      spreadsheetUrl: ss.getUrl()
    });
    
  } catch (error) {
    Logger.log("❌ Error en test: " + error.toString());
    Logger.log("Stack: " + error.stack);
    return jsonResponse({
      status: "ERROR",
      message: error.toString(),
      hint: "Verifica que el SPREADSHEET_ID sea correcto y tengas permisos de edición"
    });
  }
}

// ==========================================
// CATÁLOGO
// ==========================================
function handleGetCatalog() {
  Logger.log("=== 📚 GET_CATALOG ===");
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Plantillas");
    
    if (!sheet) {
      Logger.log("❌ No se encontró la hoja 'Plantillas'");
      return jsonResponse([]);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    Logger.log("📋 Headers encontrados: " + JSON.stringify(headers));

    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        let key = header.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, '');
        obj[key] = row[i];
      });
      return obj;
    });
    
    // Log del primer item para debug
    if (result.length > 0) {
      Logger.log("📦 Primer item (ejemplo): " + JSON.stringify(result[0]));
    }
    
    Logger.log("✅ Catálogo: " + result.length + " items");
    return jsonResponse(result);
  } catch (e) {
    Logger.log("❌ Error catálogo: " + e.toString());
    return jsonResponse([]);
  }
}

// ==========================================
// CREAR PREFERENCIA MP
// ==========================================
function handleCreateMPPreference(p) {
  Logger.log("=== 💳 CREATE_MP_PREFERENCE ===");
  Logger.log("Total: " + p.total);
  Logger.log("Email: " + p.email);
  Logger.log("Cliente: " + p.customer_name);
  Logger.log("Título: " + p.title);
  Logger.log("Back URL: " + p.back_url);

  if (!p.total || isNaN(parseFloat(p.total))) {
    Logger.log("❌ Monto inválido");
    return jsonResponse({ status: "ERROR", message: "Monto total inválido" });
  }

  // Determinar URL de retorno
  let backUrl = p.back_url || "https://gestiosafe.com";
  const transactionId = "GS-" + Date.now();
  
  // Verificar si es una URL válida para auto_return (debe ser HTTPS público)
  const isValidForAutoReturn = backUrl.startsWith("https://") && 
                                !backUrl.includes("localhost") && 
                                !backUrl.includes("192.168.") &&
                                !backUrl.includes("127.0.0.1");
  
  Logger.log("🔗 URL válida para auto_return: " + isValidForAutoReturn);
  
  // Si es desarrollo local, usar URL de producción para back_urls
  if (!isValidForAutoReturn) {
    Logger.log("⚠️ URL local detectada, usando gestiosafe.com para back_urls");
    backUrl = "https://gestiosafe.com";
  }
  
  const payload = {
    items: [{
      title: p.title || "Producto Gestiosafe",
      quantity: 1,
      currency_id: p.currency_id || "PEN",
      unit_price: parseFloat(p.total)
    }],
    payer: {
      email: p.email || "test@test.com",
      name: p.customer_name || "Cliente"
    },
    back_urls: {
      success: backUrl,
      failure: backUrl,
      pending: backUrl
    },
    external_reference: transactionId
  };
  
  // Solo agregar auto_return si la URL es válida (HTTPS público)
  if (isValidForAutoReturn) {
    payload.auto_return = "approved";
  }

  Logger.log("📦 Payload MP: " + JSON.stringify(payload));

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + MP_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    Logger.log("📡 Enviando a Mercado Pago...");
    const response = UrlFetchApp.fetch("https://api.mercadopago.com/checkout/preferences", options);
    const code = response.getResponseCode();
    const text = response.getContentText();
    
    Logger.log("📨 HTTP " + code);
    Logger.log("📨 Response: " + text);
    
    const data = JSON.parse(text);

    if (data.id) {
      Logger.log("✅ Preferencia creada: " + data.id);
      Logger.log("✅ Init point: " + data.init_point);
      
      // Registrar como PENDIENTE
      registrarVentaPendiente(data.id, p);
      
      return jsonResponse({
        status: "SUCCESS",
        preferenceId: data.id,
        init_point: data.init_point,
        transactionId: transactionId
      });
    } else {
      Logger.log("❌ Error MP: " + JSON.stringify(data));
      return jsonResponse({ 
        status: "ERROR", 
        message: data.message || "Error creando preferencia",
        details: data
      });
    }
  } catch (e) {
    Logger.log("❌ Excepción: " + e.toString());
    return jsonResponse({ status: "ERROR", message: e.toString() });
  }
}

// ==========================================
// REGISTRAR VENTA PENDIENTE
// ==========================================
function registrarVentaPendiente(preferenceId, p) {
  Logger.log("=== 📝 REGISTRAR VENTA PENDIENTE ===");
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("Ventas");
    
    if (!sheet) {
      Logger.log("Creando hoja Ventas...");
      sheet = ss.insertSheet("Ventas");
      sheet.appendRow(["Fecha", "Payment ID", "Preference ID", "Cliente", "Email", "Items", "Total", "Moneda", "Estado"]);
    }
    
    const row = [
      new Date(),
      "PENDIENTE",
      preferenceId,
      p.customer_name || "Cliente",
      p.email || "N/A",
      p.title || "Productos",
      p.total,
      p.currency_id || "PEN",
      "🟡 PENDIENTE"
    ];
    
    sheet.appendRow(row);
    Logger.log("✅ Venta pendiente registrada: " + JSON.stringify(row));
  } catch (e) {
    Logger.log("⚠️ Error registrando pendiente: " + e.toString());
  }
}

// ==========================================
// OBTENER LINKS DE DESCARGA POR IDS DE PRODUCTOS
// ==========================================
function getDownloadLinksForProducts(productIds) {
  Logger.log("=== 🔗 GET_DOWNLOAD_LINKS ===");
  Logger.log("Product IDs: " + JSON.stringify(productIds));
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Plantillas");
    
    if (!sheet) {
      Logger.log("❌ Hoja 'Plantillas' no encontrada");
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("ID");
    const linkIndex = headers.indexOf("Link de Descarga");
    
    if (idIndex === -1 || linkIndex === -1) {
      Logger.log("❌ Columnas 'ID' o 'Link de Descarga' no encontradas");
      return [];
    }
    
    const links = [];
    
    // Buscar cada producto por su ID
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const productId = row[idIndex]?.toString();
      const link = row[linkIndex]?.toString();
      
      if (productIds.includes(productId) && link) {
        links.push({
          id: productId,
          link: link
        });
        Logger.log("✅ Link encontrado para producto: " + productId);
      }
    }
    
    Logger.log("📦 Total links encontrados: " + links.length);
    return links;
  } catch (e) {
    Logger.log("❌ Error obteniendo links: " + e.toString());
    return [];
  }
}

// ==========================================
// VERIFICAR POR PAYMENT ID (Número de operación)
// ==========================================
function handleVerifyByPaymentId(p) {
  Logger.log("=== 🔍 VERIFY_BY_PAYMENT_ID ===");
  Logger.log("Payment ID: " + p.payment_id);
  Logger.log("Email: " + p.email);
  Logger.log("Cliente: " + p.customer_name);

  if (!p.payment_id) {
    Logger.log("❌ Falta payment_id");
    return jsonResponse({ status: "ERROR", message: "Se requiere payment_id" });
  }

  try {
    const url = "https://api.mercadopago.com/v1/payments/" + p.payment_id;
    Logger.log("📡 Consultando: " + url);
    
    const options = {
      method: "get",
      headers: { "Authorization": "Bearer " + MP_ACCESS_TOKEN },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const text = response.getContentText();
    
    Logger.log("📨 HTTP " + code);
    Logger.log("📨 Response: " + text.substring(0, 500) + "...");

    if (code === 200) {
      const payment = JSON.parse(text);
      Logger.log("💰 Estado del pago: " + payment.status);
      Logger.log("💰 Monto: " + payment.transaction_amount + " " + payment.currency_id);

      if (payment.status === "approved") {
        Logger.log("✅ ¡PAGO APROBADO!");
        
        // Actualizar registro a APROBADO
        actualizarVentaAprobada(payment.id, payment, p);
        
        // 🔒 SEGURIDAD: Obtener links de descarga solo si el pago está aprobado
        let downloadLinks = [];
        if (p.product_ids) {
          try {
            const productIds = JSON.parse(p.product_ids);
            Logger.log("🔒 Obteniendo links para productos aprobados: " + JSON.stringify(productIds));
            downloadLinks = getDownloadLinksForProducts(productIds);
          } catch (e) {
            Logger.log("⚠️ Error parseando product_ids: " + e.toString());
          }
        }
        
        return jsonResponse({
          status: "approved",
          payment_id: payment.id,
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          payer_email: payment.payer?.email,
          message: "¡Pago verificado exitosamente!",
          download_links: downloadLinks  // 🔒 SOLO disponibles si pago aprobado
        });
      } else {
        Logger.log("⏳ Pago no aprobado: " + payment.status);
        return jsonResponse({
          status: payment.status,
          payment_id: payment.id,
          message: "Estado del pago: " + payment.status + " - " + (payment.status_detail || "")
        });
      }
    } else if (code === 404) {
      Logger.log("❌ Pago no encontrado");
      return jsonResponse({ status: "not_found", message: "Pago no encontrado con ese número de operación" });
    } else {
      Logger.log("❌ Error HTTP " + code);
      return jsonResponse({ status: "error", message: "Error HTTP " + code });
    }
  } catch (e) {
    Logger.log("❌ Error: " + e.toString());
    return jsonResponse({ status: "error", message: e.toString() });
  }
}

// ==========================================
// VERIFICAR POR PREFERENCE ID
// ==========================================
function handleVerifyPayment(p) {
  Logger.log("=== 🔍 VERIFY_PAYMENT ===");
  Logger.log("Preference ID: " + p.preference_id);

  if (!p.preference_id) {
    return jsonResponse({ status: "ERROR", message: "Se requiere preference_id" });
  }

  try {
    // Buscar por external_reference que es el transactionId
    const url = "https://api.mercadopago.com/v1/payments/search?external_reference=" + p.preference_id + "&sort=date_created&criteria=desc";
    Logger.log("📡 Buscando: " + url);
    
    const options = {
      method: "get",
      headers: { "Authorization": "Bearer " + MP_ACCESS_TOKEN },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    Logger.log("📨 Resultados: " + data.results?.length || 0);

    if (data.results && data.results.length > 0) {
      const payment = data.results.find(p => p.status === "approved") || data.results[0];
      Logger.log("💰 Pago encontrado: " + payment.id + " - " + payment.status);
      
      if (payment.status === "approved") {
        actualizarVentaAprobada(payment.id, payment, p);
        return jsonResponse({
          status: "approved",
          payment_id: payment.id,
          amount: payment.transaction_amount,
          message: "¡Pago verificado!"
        });
      } else {
        return jsonResponse({ status: payment.status, message: "Estado: " + payment.status });
      }
    } else {
      Logger.log("❌ Sin resultados");
      return jsonResponse({ status: "not_found", message: "No hay pagos para esta preferencia" });
    }
  } catch (e) {
    Logger.log("❌ Error: " + e.toString());
    return jsonResponse({ status: "error", message: e.toString() });
  }
}

// ==========================================
// ACTUALIZAR VENTA A APROBADA
// ==========================================
function actualizarVentaAprobada(paymentId, payment, p) {
  Logger.log("=== ✅ ACTUALIZAR VENTA APROBADA ===");
  Logger.log("Payment ID: " + paymentId);
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("Ventas");
    
    if (!sheet) {
      Logger.log("Creando hoja Ventas...");
      sheet = ss.insertSheet("Ventas");
      sheet.appendRow(["Fecha", "Payment ID", "Preference ID", "Cliente", "Email", "Items", "Total", "Moneda", "Estado"]);
    }
    
    const data = sheet.getDataRange().getValues();
    let found = false;
    
    // Buscar si ya existe este payment
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(paymentId)) {
        Logger.log("ℹ️ Payment ya registrado en fila " + (i+1));
        found = true;
        break;
      }
      
      // Buscar pendiente y actualizar
      if (data[i][1] === "PENDIENTE" && data[i][8] === "🟡 PENDIENTE") {
        Logger.log("📝 Actualizando fila " + (i+1) + " de PENDIENTE a APROBADO");
        sheet.getRange(i + 1, 2).setValue(paymentId); // Payment ID
        sheet.getRange(i + 1, 9).setValue("✅ APROBADO"); // Estado
        found = true;
        Logger.log("✅ Fila actualizada");
        break;
      }
    }
    
    if (!found) {
      Logger.log("📝 Creando nueva fila de venta aprobada...");
      const newRow = [
        new Date(),
        paymentId,
        payment.preference_id || "N/A",
        p.customer_name || "Cliente",
        payment.payer?.email || p.email || "N/A",
        p.items || "Productos",
        payment.transaction_amount,
        payment.currency_id || "PEN",
        "✅ APROBADO"
      ];
      sheet.appendRow(newRow);
      Logger.log("✅ Nueva fila creada: " + JSON.stringify(newRow));
    }
  } catch (e) {
    Logger.log("⚠️ Error actualizando venta: " + e.toString());
  }
}

// ==========================================
// PROCESAR PAGO CON TARJETA (GET)
// ==========================================
function handleProcessCardPaymentGET(p) {
  Logger.log("=== 💳 PROCESS_CARD_PAYMENT ===");
  Logger.log("Parámetros: " + JSON.stringify(p));
  
  const url = "https://api.mercadopago.com/v1/payments";
  
  const payload = {
    transaction_amount: parseFloat(p.transaction_amount),
    token: p.token,
    description: p.description || "Compra Gestiosafe",
    installments: parseInt(p.installments) || 1,
    payment_method_id: p.payment_method_id,
    payer: {
      email: p.payer_email || "test@test.com",
      identification: {
        type: p.payer_identification_type || "DNI",
        number: p.payer_identification_number || "12345678"
      }
    }
  };
  
  if (p.issuer_id) {
    payload.issuer_id = p.issuer_id;
  }
  
  Logger.log("📦 Payload: " + JSON.stringify(payload));
  
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + MP_ACCESS_TOKEN,
      "X-Idempotency-Key": Utilities.getUuid()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    Logger.log("📡 Enviando pago...");
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const text = response.getContentText();
    
    Logger.log("📨 HTTP " + code + ": " + text);
    
    const result = JSON.parse(text);
    
    if (code === 200 || code === 201) {
      Logger.log("✅ Pago procesado: " + result.status);
      
      if (result.status === 'approved') {
        actualizarVentaAprobada(result.id, result, p);
      }
      
      return jsonResponse({
        status: result.status,
        id: result.id,
        status_detail: result.status_detail,
        message: getStatusMessage(result.status, result.status_detail)
      });
    } else {
      Logger.log("❌ Error en pago");
      return jsonResponse({
        status: "error",
        message: result.message || "Error procesando pago",
        details: result
      });
    }
  } catch (e) {
    Logger.log("❌ Excepción: " + e.toString());
    return jsonResponse({ status: "error", message: e.toString() });
  }
}

// ==========================================
// Mensajes de estado
// ==========================================
function getStatusMessage(status, statusDetail) {
  const messages = {
    'approved': '¡Pago aprobado exitosamente!',
    'pending': 'El pago está pendiente de confirmación.',
    'in_process': 'El pago está siendo procesado.',
    'rejected': 'El pago fue rechazado.',
    'cc_rejected_other_reason': 'Tarjeta rechazada. En sandbox usa tarjetas de prueba.',
    'cc_rejected_call_for_authorize': 'Debes autorizar el pago con tu banco.',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente.',
  };
  return messages[statusDetail] || messages[status] || 'Estado: ' + status;
}

// ==========================================
// DO POST (para webhooks)
// ==========================================
function doPost(e) {
  Logger.log("=== 📬 DO_POST RECIBIDO ===");
  try {
    let data;
    if (e.postData && e.postData.contents) {
      Logger.log("PostData: " + e.postData.contents);
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }
    
    Logger.log("Datos: " + JSON.stringify(data));
    
    if (data.action === 'PROCESS_CARD_PAYMENT') {
      return handleProcessCardPayment(data);
    }
    
    return jsonResponse({ status: "ok", message: "Recibido" });
  } catch (e) {
    Logger.log("❌ Error: " + e.toString());
    return jsonResponse({ status: "error", message: e.toString() });
  }
}

function handleProcessCardPayment(data) {
  // Redirigir a la versión GET
  return handleProcessCardPaymentGET(data);
}

