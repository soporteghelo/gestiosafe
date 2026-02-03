
const SPREADSHEET_ID = "1Evdfwrmp--kt6P-a6Zuobs9MRR2J7leJviO7k9u2vdA";
const MP_ACCESS_TOKEN = "TEST-7737746752799435-020210-2c5bcc69ed889fe5591a8fb92b47868a-3176203752";

function doGet(e) {
  const p = e.parameter;
  const action = p.action;

  Logger.log("=== MERCADO PAGO REQUEST ===");
  Logger.log("Action: " + action);
  Logger.log("Parameters: " + JSON.stringify(p));

  switch (action) {
    case "GET_CATALOG":
      return handleGetCatalog();
    case "CREATE_MP_PREFERENCE":
      return handleCreateMPPreference(p);
    case "PROCESS_CARD_PAYMENT":
      return handleProcessCardPaymentGET(p);
    case "VERIFY_PAYMENT":
      return handleVerifyPayment(p);
    case "VERIFY_BY_PAYMENT_ID":
      return handleVerifyByPaymentId(p);
    default:
      return createJsonResponse({
        status: "ERROR",
        message: "Acción no especificada o inválida: " + action
      });
  }
}

function handleGetCatalog() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Plantillas");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        let key = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
        obj[key] = row[i];
      });
      return obj;
    });
    
    Logger.log("Catálogo devuelto: " + result.length + " items");
    return createJsonResponse(result);
  } catch (e) {
    Logger.log("Error en handleGetCatalog: " + e.toString());
    return createJsonResponse([]);
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// PROCESAR PAGO CON TARJETA (via GET - para evitar CORS)
// ==========================================
function handleProcessCardPaymentGET(p) {
  Logger.log("=== PROCESS_CARD_PAYMENT (GET) ===");
  Logger.log("Parámetros recibidos: " + JSON.stringify(p));
  
  const url = "https://api.mercadopago.com/v1/payments";
  
  // Construir el payload para el pago
  const payload = {
    transaction_amount: parseFloat(p.transaction_amount),
    token: p.token,
    description: p.description || "Compra Gestiosafe",
    installments: parseInt(p.installments) || 1,
    payment_method_id: p.payment_method_id,
    issuer_id: p.issuer_id || null,
    payer: {
      email: p.payer_email || "test@test.com",
      identification: {
        type: p.payer_identification_type || "DNI",
        number: p.payer_identification_number || "12345678"
      }
    }
  };
  
  // Remover issuer_id si está vacío
  if (!payload.issuer_id) {
    delete payload.issuer_id;
  }
  
  Logger.log("Payload de pago: " + JSON.stringify(payload));
  
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
    Logger.log("📡 Enviando pago a Mercado Pago...");
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const responseCode = response.getResponseCode();
    
    Logger.log("📨 Respuesta HTTP (" + responseCode + "): " + responseText);
    
    const result = JSON.parse(responseText);
    
    if (responseCode === 200 || responseCode === 201) {
      Logger.log("✅ Pago procesado: " + result.status);
      Logger.log("Status detail: " + result.status_detail);
      
      // Si el pago fue aprobado, registrar la venta
      if (result.status === 'approved') {
        try {
          const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
          const sheet = ss.getSheetByName("Ventas");
          if (sheet) {
            sheet.appendRow([
              new Date(),
              p.payer_email || "N/A",
              result.id,
              result.status,
              p.transaction_amount,
              p.currency_id || "PEN",
              result.payment_method_id,
              "Card Payment Brick"
            ]);
            Logger.log("✅ Venta registrada en hoja");
          }
        } catch (sheetError) {
          Logger.log("⚠️ Error registrando venta: " + sheetError.toString());
        }
      }
      
      return createJsonResponse({
        status: result.status,
        id: result.id,
        status_detail: result.status_detail,
        payment_method_id: result.payment_method_id,
        message: getStatusMessage(result.status, result.status_detail)
      });
    } else {
      Logger.log("❌ Error en pago - HTTP " + responseCode);
      return createJsonResponse({
        status: "error",
        message: result.message || "Error procesando pago",
        cause: result.cause,
        status_detail: result.status_detail,
        details: result
      });
    }
    
  } catch (e) {
    Logger.log("💥 Excepción: " + e.toString());
    Logger.log("Stack: " + e.stack);
    return createJsonResponse({
      status: "error",
      message: e.toString()
    });
  }
}

// Función auxiliar para mensajes de estado
function getStatusMessage(status, statusDetail) {
  const messages = {
    'approved': '¡Pago aprobado exitosamente!',
    'pending': 'El pago está pendiente de confirmación.',
    'in_process': 'El pago está siendo procesado.',
    'rejected': 'El pago fue rechazado.',
    'cc_rejected_other_reason': 'Tarjeta rechazada. En modo sandbox, usa tarjetas de prueba.',
    'cc_rejected_call_for_authorize': 'Debes autorizar el pago ante tu banco.',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente.',
    'cc_rejected_bad_filled_card_number': 'Número de tarjeta incorrecto.',
    'cc_rejected_bad_filled_security_code': 'Código de seguridad incorrecto.',
    'cc_rejected_bad_filled_date': 'Fecha de vencimiento incorrecta.',
  };
  return messages[statusDetail] || messages[status] || 'Estado: ' + status;
}

// ==========================================
// VERIFICAR PAGO POR PREFERENCE ID
// ==========================================
function handleVerifyPayment(p) {
  Logger.log("=== VERIFY_PAYMENT ===");
  Logger.log("Preference ID: " + p.preference_id);
  Logger.log("Items: " + p.items);
  Logger.log("Email: " + p.email);
  Logger.log("Customer: " + p.customer_name);
  
  if (!p.preference_id) {
    return createJsonResponse({
      status: "ERROR",
      message: "Se requiere preference_id"
    });
  }
  
  try {
    // Buscar pagos asociados a esta preferencia
    const url2 = "https://api.mercadopago.com/v1/payments/search?preference_id=" + p.preference_id + "&sort=date_created&criteria=desc";
    
    const options = {
      method: "get",
      headers: {
        "Authorization": "Bearer " + MP_ACCESS_TOKEN
      },
      muteHttpExceptions: true
    };
    
    Logger.log("📡 Buscando pagos para preference: " + p.preference_id);
    
    const response = UrlFetchApp.fetch(url2, options);
    const responseText = response.getContentText();
    const responseCode = response.getResponseCode();
    
    Logger.log("📨 Respuesta (" + responseCode + "): " + responseText);
    
    const result = JSON.parse(responseText);
    
    if (responseCode === 200 && result.results && result.results.length > 0) {
      // Buscar el pago más reciente aprobado
      const approvedPayment = result.results.find(payment => payment.status === 'approved');
      
      if (approvedPayment) {
        Logger.log("✅ Pago aprobado encontrado: " + approvedPayment.id);
        
        // Actualizar el registro pendiente a APROBADO
        try {
          const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
          let sheet = ss.getSheetByName("Ventas");
          
          if (sheet) {
            const data = sheet.getDataRange().getValues();
            
            // Buscar si ya existe este payment_id
            let paymentExists = false;
            for (let i = 1; i < data.length; i++) {
              if (String(data[i][2]) === String(approvedPayment.id)) {
                paymentExists = true;
                break;
              }
            }
            
            if (!paymentExists) {
              // Buscar la fila con este preference_id y actualizarla
              let updated = false;
              for (let i = 1; i < data.length; i++) {
                if (String(data[i][1]) === String(p.preference_id) && data[i][8] === "🟡 PENDIENTE") {
                  // Actualizar esta fila
                  sheet.getRange(i + 1, 3).setValue(approvedPayment.id); // Payment ID
                  sheet.getRange(i + 1, 9).setValue("✅ APROBADO"); // Estado
                  updated = true;
                  Logger.log("✅ Fila " + (i + 1) + " actualizada a APROBADO");
                  break;
                }
              }
              
              // Si no encontró, crear nueva fila
              if (!updated) {
                let items = [];
                try {
                  if (p.items) {
                    items = JSON.parse(decodeURIComponent(p.items));
                  }
                } catch (parseError) {
                  items = [{ name: "Producto", price: approvedPayment.transaction_amount }];
                }
                
                const itemNames = items.map(function(item) { return item.name; }).join(", ");
                
                sheet.appendRow([
                  new Date(),
                  p.preference_id || "N/A",
                  approvedPayment.id,
                  p.customer_name || "Cliente",
                  approvedPayment.payer?.email || p.email || "N/A",
                  itemNames || "Productos Gestiosafe",
                  approvedPayment.transaction_amount,
                  approvedPayment.currency_id || "PEN",
                  "✅ APROBADO"
                ]);
                Logger.log("✅ Nueva fila creada con pago APROBADO");
              }
            } else {
              Logger.log("ℹ️ Pago ya estaba registrado");
            }
          }
        } catch (sheetError) {
          Logger.log("⚠️ Error actualizando venta: " + sheetError.toString());
        }
        
        return createJsonResponse({
          status: "approved",
          payment_id: approvedPayment.id,
          amount: approvedPayment.transaction_amount,
          currency: approvedPayment.currency_id,
          payer_email: approvedPayment.payer?.email,
          date: approvedPayment.date_approved,
          message: "¡Pago verificado exitosamente!"
        });
      } else {
        // Hay pagos pero ninguno aprobado
        const latestPayment = result.results[0];
        Logger.log("⏳ Pago encontrado pero no aprobado: " + latestPayment.status);
        
        return createJsonResponse({
          status: latestPayment.status,
          payment_id: latestPayment.id,
          status_detail: latestPayment.status_detail,
          message: getStatusMessage(latestPayment.status, latestPayment.status_detail)
        });
      }
    } else {
      Logger.log("❌ No se encontraron pagos para esta preferencia");
      return createJsonResponse({
        status: "not_found",
        message: "No se encontró ningún pago para esta transacción. Por favor completa el pago primero."
      });
    }
    
  } catch (e) {
    Logger.log("💥 Error verificando pago: " + e.toString());
    return createJsonResponse({
      status: "error",
      message: e.toString()
    });
  }
}

// ==========================================
// VERIFICAR PAGO POR NÚMERO DE OPERACIÓN (Payment ID)
// ==========================================
function handleVerifyByPaymentId(p) {
  Logger.log("=== VERIFY_BY_PAYMENT_ID ===");
  Logger.log("Payment ID: " + p.payment_id);
  Logger.log("Items: " + p.items);
  Logger.log("Email: " + p.email);
  Logger.log("Customer: " + p.customer_name);
  
  if (!p.payment_id) {
    return createJsonResponse({
      status: "ERROR",
      message: "Se requiere el número de operación (payment_id)"
    });
  }
  
  try {
    // Buscar el pago directamente por su ID
    const url = "https://api.mercadopago.com/v1/payments/" + p.payment_id;
    
    const options = {
      method: "get",
      headers: {
        "Authorization": "Bearer " + MP_ACCESS_TOKEN
      },
      muteHttpExceptions: true
    };
    
    Logger.log("📡 Buscando pago con ID: " + p.payment_id);
    
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const responseCode = response.getResponseCode();
    
    Logger.log("📨 Respuesta (" + responseCode + "): " + responseText);
    
    if (responseCode === 200) {
      const payment = JSON.parse(responseText);
      
      if (payment.status === 'approved') {
        Logger.log("✅ Pago aprobado encontrado: " + payment.id);
        
        // Actualizar el registro pendiente a APROBADO
        try {
          const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
          let sheet = ss.getSheetByName("Ventas");
          
          if (sheet) {
            const data = sheet.getDataRange().getValues();
            
            // Buscar si ya existe este payment_id
            let paymentExists = false;
            for (let i = 1; i < data.length; i++) {
              if (String(data[i][2]) === String(payment.id)) {
                paymentExists = true;
                break;
              }
            }
            
            if (!paymentExists) {
              // Buscar la fila pendiente con este preference_id y actualizarla
              let updated = false;
              for (let i = 1; i < data.length; i++) {
                // Si hay una fila pendiente (sin payment_id específico)
                if (data[i][2] === "PENDIENTE" && data[i][8] === "🟡 PENDIENTE") {
                  // Actualizar esta fila
                  sheet.getRange(i + 1, 3).setValue(payment.id); // Payment ID
                  sheet.getRange(i + 1, 9).setValue("✅ APROBADO"); // Estado
                  updated = true;
                  Logger.log("✅ Fila " + (i + 1) + " actualizada a APROBADO");
                  break;
                }
              }
              
              // Si no encontró pendiente, crear nueva fila
              if (!updated) {
                let items = [];
                try {
                  if (p.items) {
                    items = JSON.parse(decodeURIComponent(p.items));
                  }
                } catch (parseError) {
                  items = [{ name: "Producto", price: payment.transaction_amount }];
                }
                
                const itemNames = items.map(function(item) { return item.name; }).join(", ");
                
                sheet.appendRow([
                  new Date(),
                  payment.preference_id || "N/A",
                  payment.id,
                  p.customer_name || "Cliente",
                  payment.payer?.email || p.email || "N/A",
                  itemNames || "Productos Gestiosafe",
                  payment.transaction_amount,
                  payment.currency_id || "PEN",
                  "✅ APROBADO"
                ]);
                Logger.log("✅ Nueva fila creada con pago APROBADO");
              }
            } else {
              Logger.log("ℹ️ Pago ya estaba registrado");
            }
          }
        } catch (sheetError) {
          Logger.log("⚠️ Error actualizando venta: " + sheetError.toString());
        }
        
        return createJsonResponse({
          status: "approved",
          payment_id: payment.id,
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          payer_email: payment.payer?.email,
          date: payment.date_approved,
          message: "¡Pago verificado exitosamente!"
        });
      } else {
        Logger.log("⏳ Pago encontrado pero estado: " + payment.status);
        return createJsonResponse({
          status: payment.status,
          payment_id: payment.id,
          status_detail: payment.status_detail,
          message: getStatusMessage(payment.status, payment.status_detail)
        });
      }
    } else if (responseCode === 404) {
      Logger.log("❌ No se encontró el pago con ID: " + p.payment_id);
      return createJsonResponse({
        status: "not_found",
        message: "No se encontró ningún pago con ese número de operación. Verifica que sea correcto."
      });
    } else {
      const errorData = JSON.parse(responseText);
      Logger.log("❌ Error de API: " + JSON.stringify(errorData));
      return createJsonResponse({
        status: "error",
        message: errorData.message || "Error al verificar el pago"
      });
    }
    
  } catch (e) {
    Logger.log("💥 Error verificando pago: " + e.toString());
    return createJsonResponse({
      status: "error",
      message: e.toString()
    });
  }
}

// ==========================================
// CREAR PREFERENCIA DE MERCADO PAGO
// ==========================================
function handleCreateMPPreference(p) {
    Logger.log("=== INICIANDO CREATE_MP_PREFERENCE ===");
    Logger.log("Datos recibidos: " + JSON.stringify(p));

    if (!p.total || isNaN(parseFloat(p.total))) {
        Logger.log("❌ Error: Monto total inválido");
        return createJsonResponse({ status: "ERROR", message: "Monto total inválido." });
    }

    // Generar un ID único para esta transacción
    const transactionId = "GS-" + new Date().getTime();

    const url = "https://api.mercadopago.com/checkout/preferences";

    // URL de retorno - usar la que envía el frontend o una por defecto
    const backUrl = p.back_url || "https://gestiosafe.com";

    const payload = {
        items: [
            {
                title: p.title || "Producto Gestiosafe",
                quantity: 1,
                currency_id: p.currency_id || "PEN",
                unit_price: parseFloat(p.total)
            }
        ],
        payer: {
            email: p.email || "test@user.com",
            name: p.customer_name || "Cliente",
            surname: "Gestiosafe"
        },
        back_urls: {
            success: backUrl,
            failure: backUrl,
            pending: backUrl
        },
        external_reference: transactionId,
        auto_return: "approved",
        binary_mode: false
    };

    Logger.log("Payload: " + JSON.stringify(payload));

    const options = {
        method: "post",
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer " + MP_ACCESS_TOKEN
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    try {
        Logger.log("📡 Enviando request a Mercado Pago: " + url);
        Logger.log("🔐 Token usado: " + (MP_ACCESS_TOKEN ? "✅ Presente" : "❌ Ausente"));

        const response = UrlFetchApp.fetch(url, options);
        const responseText = response.getContentText();
        const responseCode = response.getResponseCode();

        Logger.log("📨 Respuesta HTTP (" + responseCode + "): " + responseText);

        const data = JSON.parse(responseText);

        if ((responseCode === 200 || responseCode === 201) && data.id) {
            Logger.log("✅ ÉXITO: Preferencia creada");
            Logger.log("ID: " + data.id);
            Logger.log("init_point: " + data.init_point);
            
            // REGISTRAR COMPRA COMO PENDIENTE
            try {
              const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
              let sheet = ss.getSheetByName("Ventas");
              
              // Crear la hoja si no existe
              if (!sheet) {
                sheet = ss.insertSheet("Ventas");
                sheet.appendRow([
                  "Fecha",
                  "Preference ID",
                  "Payment ID", 
                  "Cliente",
                  "Email",
                  "Items",
                  "Total",
                  "Moneda",
                  "Estado"
                ]);
              }
              
              // Registrar como pendiente
              sheet.appendRow([
                new Date(),
                data.id,
                "PENDIENTE",
                p.customer_name || "Cliente",
                p.email || "N/A",
                p.title || "Productos Gestiosafe",
                parseFloat(p.total),
                p.currency_id || "PEN",
                "🟡 PENDIENTE"
              ]);
              
              Logger.log("✅ Compra registrada como PENDIENTE");
            } catch (sheetError) {
              Logger.log("⚠️ Error registrando pendiente: " + sheetError.toString());
            }
            
            return createJsonResponse({ 
                status: "SUCCESS", 
                preferenceId: data.id, 
                init_point: data.init_point,
                transactionId: transactionId
            });
        } else {
            Logger.log("❌ FALLO: MP devolvió error o no hay ID");
            Logger.log("Response Data: " + JSON.stringify(data));
            return createJsonResponse({
                status: "ERROR",
                message: "Error al crear preferencia en Mercado Pago",
                details: data
            });
        }

    } catch (e) {
        Logger.log("💥 EXCEPCIÓN: " + e.toString());
        Logger.log("Stack: " + e.stack);
        return createJsonResponse({ 
            status: "ERROR", 
            message: e.toString()
        });
    }
}

function doPost(e) {
  try {
    Logger.log("=== DO_POST RECIBIDO ===");
    
    // Intentar parsear como JSON primero
    let requestData;
    if (e.postData && e.postData.contents) {
      Logger.log("PostData: " + e.postData.contents);
      requestData = JSON.parse(e.postData.contents);
    } else {
      requestData = e.parameter;
    }
    
    Logger.log("Datos parseados: " + JSON.stringify(requestData));
    
    // Si es un pago con tarjeta
    if (requestData.action === 'PROCESS_CARD_PAYMENT') {
      return handleProcessCardPayment(requestData);
    }
    
    // Registro de venta tradicional
    const p = requestData;
    Logger.log("Registrando venta: " + JSON.stringify(p));
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Ventas");
    sheet.appendRow([
      new Date(),
      p.firstName || "N/A",
      p.lastName || "N/A",
      p.email || "N/A",
      p.docNumber || "N/A",
      p.phone || "N/A",
      p.order || "N/A",
      p.total || "0",
      "Mercado Pago"
    ]);
    
    Logger.log("✅ Venta registrada exitosamente");
    return createJsonResponse({ status: "success", message: "Venta registrada" });
  } catch (e) {
    Logger.log("❌ Error en doPost: " + e.toString());
    return createJsonResponse({ status: "error", message: e.toString() });
  }
}

// ==========================================
// PROCESAR PAGO CON TARJETA (Card Payment Brick)
// ==========================================
function handleProcessCardPayment(data) {
  Logger.log("=== PROCESS_CARD_PAYMENT ===");
  Logger.log("Payment Data: " + JSON.stringify(data));
  
  const paymentData = data.paymentData;
  const url = "https://api.mercadopago.com/v1/payments";
  
  // Construir el payload para el pago
  const payload = {
    transaction_amount: parseFloat(data.amount),
    token: paymentData.token,
    description: data.description || "Compra Gestiosafe",
    installments: paymentData.installments || 1,
    payment_method_id: paymentData.payment_method_id,
    issuer_id: paymentData.issuer_id,
    payer: {
      email: data.email || paymentData.payer?.email || "test@test.com",
      identification: paymentData.payer?.identification || {
        type: "DNI",
        number: "12345678"
      }
    }
  };
  
  Logger.log("Payload de pago: " + JSON.stringify(payload));
  
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
    Logger.log("📡 Enviando pago a Mercado Pago...");
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const responseCode = response.getResponseCode();
    
    Logger.log("📨 Respuesta (" + responseCode + "): " + responseText);
    
    const result = JSON.parse(responseText);
    
    if (responseCode === 200 || responseCode === 201) {
      Logger.log("✅ Pago procesado: " + result.status);
      
      // Si el pago fue aprobado, registrar la venta
      if (result.status === 'approved') {
        try {
          const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
          const sheet = ss.getSheetByName("Ventas");
          sheet.appendRow([
            new Date(),
            paymentData.payer?.email || data.email || "N/A",
            result.id,
            result.status,
            data.amount,
            data.currency_id || "PEN",
            result.payment_method_id,
            "Card Payment Brick"
          ]);
          Logger.log("✅ Venta registrada en hoja");
        } catch (sheetError) {
          Logger.log("⚠️ Error registrando venta: " + sheetError.toString());
        }
      }
      
      return createJsonResponse({
        status: result.status,
        id: result.id,
        status_detail: result.status_detail,
        payment_method_id: result.payment_method_id
      });
    } else {
      Logger.log("❌ Error en pago");
      return createJsonResponse({
        status: "error",
        message: result.message || "Error procesando pago",
        cause: result.cause,
        details: result
      });
    }
    
  } catch (e) {
    Logger.log("💥 Excepción: " + e.toString());
    return createJsonResponse({
      status: "error",
      message: e.toString()
    });
  }
}
