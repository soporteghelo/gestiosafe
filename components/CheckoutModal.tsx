import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { APPS_SCRIPT_URL, MERCADOPAGO_PUBLIC_KEY, EXCHANGE_RATE, DISCOUNT_PERCENT, PROMO_NAME, PROMO_MESSAGE } from '../config';

declare global {
  interface Window {
    KRGlue?: any;
    KR?: any;
  }
}

const CheckoutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cart, total, clearCart, removeFromCart } = useCart();
  const [step, setStep] = useState(1);
  const [loadingToken, setLoadingToken] = useState(false);
  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [mpInitPoint, setMpInitPoint] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentIdInput, setPaymentIdInput] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    docNumber: '',
    phone: '',
  });

  const [selectedCurrency, setSelectedCurrency] = useState<'PEN' | 'USD'>('PEN');
  // EXCHANGE_RATE importado desde config.ts

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const formInitialized = useRef(false);

  const addLog = React.useCallback((msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} -> ${msg}`]);
  }, []);

  const handlePaymentResult = React.useCallback((res: any) => {
    addLog("Resultado Payment: " + JSON.stringify(res));

    if (res.status === 'approved') {
      setStep(3);
    } else {
      console.log("Error details:", res);
      const details = res.error?.payment || res.error?.details || {};
      const statusDetail = details.status_detail || res.error?.message || 'Error desconocido';

      if (statusDetail === 'cc_rejected_other_reason') {
        alert("⛔ PAGO RECHAZADO\n\nEstás en modo PRUEBA (Sandbox), por lo que las tarjetas reales son rechazadas automáticamente.\n\n✅ SOLUCIÓN: Usa la tarjeta de prueba: 4444 4444 4444 4444");
      } else if (statusDetail === 'cc_rejected_call_for_authorize') {
        alert("⛔ Rechazado: Debes autorizar la operación con tu banco.");
      } else if (statusDetail === 'cc_rejected_insufficient_amount') {
        alert("⛔ Rechazado: Fondos insuficientes.");
      } else {
        alert(`❌ El pago no pudo procesarse.\nDetalle: ${statusDetail}`);
      }
    }
  }, [addLog]);

  const getTotalInCurrency = () => {
    if (selectedCurrency === 'PEN') {
      return (total * EXCHANGE_RATE);
    }
    return total;
  };

  // Calcular descuento
  const getDiscountAmount = () => {
    if (DISCOUNT_PERCENT <= 0) return 0;
    return getTotalInCurrency() * (DISCOUNT_PERCENT / 100);
  };

  // Total con descuento aplicado
  const getFinalTotal = () => {
    return getTotalInCurrency() - getDiscountAmount();
  };

  const getAmountForPayment = () => {
    return Number(getFinalTotal().toFixed(2));
  };

  const getCurrencySymbol = () => selectedCurrency === 'PEN' ? 'S/' : '$';

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      formInitialized.current = false;
      setPaymentProcessing(false);
      setMpPreferenceId(null);
      setVerifyingPayment(false);
      setPaymentVerified(false);
      setPaymentIdInput('');
      setLogs([]);
    }
  }, [isOpen]);

  // Función para verificar el pago por número de operación
  const verifyByPaymentId = async () => {
    if (!paymentIdInput.trim()) {
      alert("Por favor ingresa el número de operación.");
      return;
    }

    setVerifyingPayment(true);
    addLog(`🔍 Verificando pago #${paymentIdInput}...`);

    try {
      // 🔒 SEGURIDAD: Solo enviar IDs de productos, NO los links
      const productIds = cart.map(item => item.id).filter(Boolean);

      const query = new URLSearchParams({
        action: 'VERIFY_BY_PAYMENT_ID',
        payment_id: paymentIdInput.trim(),
        email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        product_ids: encodeURIComponent(JSON.stringify(productIds))
      });

      const res = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`);
      const data = await res.json();

      addLog(`📥 Respuesta: ${JSON.stringify(data)}`);

      if (data.status === 'approved') {
        addLog("✅ ¡Pago verificado exitosamente!");
        setPaymentVerified(true);
        setStep(3);
      } else if (data.status === 'pending' || data.status === 'in_process') {
        alert("⏳ Tu pago está pendiente de confirmación.\n\nPor favor espera unos minutos y vuelve a intentar.");
      } else if (data.status === 'not_found') {
        alert("❌ No se encontró ningún pago con ese número.\n\nVerifica que el número de operación sea correcto.");
      } else {
        alert(`❌ Estado del pago: ${data.status}\n\n${data.message || 'Por favor verifica el número de operación.'}`);
      }
    } catch (e: any) {
      console.error(e);
      addLog(`❌ Error: ${e.message}`);
      alert("Error al verificar el pago. Por favor intenta de nuevo.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Función para verificar el pago
  const verifyPayment = async () => {
    if (!mpPreferenceId) {
      alert("No hay una preferencia de pago activa.");
      return;
    }

    setVerifyingPayment(true);
    addLog("🔍 Verificando estado del pago...");

    try {
      // 🔒 SEGURIDAD: Solo enviar IDs de productos, NO los links
      const productIds = cart.map(item => item.id).filter(Boolean);

      const query = new URLSearchParams({
        action: 'VERIFY_PAYMENT',
        preference_id: mpPreferenceId,
        email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        product_ids: encodeURIComponent(JSON.stringify(productIds))
      });

      const res = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`);
      const data = await res.json();

      addLog(`📥 Respuesta verificación: ${JSON.stringify(data)}`);

      if (data.status === 'approved') {
        addLog("✅ ¡Pago verificado exitosamente!");
        setPaymentVerified(true);
        setStep(3);
      } else if (data.status === 'pending' || data.status === 'in_process') {
        alert("⏳ Tu pago está pendiente de confirmación.\n\nPor favor espera unos segundos y vuelve a intentar.");
      } else if (data.status === 'not_found') {
        alert("❌ No encontramos ningún pago.\n\nAsegúrate de completar el pago en la ventana de Mercado Pago y luego presiona este botón.");
      } else {
        alert(`❌ Estado del pago: ${data.status}\n\n${data.message || 'Por favor intenta de nuevo.'}`);
      }
    } catch (e: any) {
      console.error(e);
      addLog(`❌ Error verificando: ${e.message}`);
      alert("Error al verificar el pago. Por favor intenta de nuevo.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleCreatePreference = async () => {
    if (loadingToken || !formData.email) return;
    setLoadingToken(true);
    setMpPreferenceId(null);

    // Construir título con items
    const title = cart.map(i => i.name).join(', ').substring(0, 200);
    const amountToPay = getAmountForPayment();

    // Enviamos currency_id al backend para que cree la preferencia correctamente
    const query = new URLSearchParams({
      action: 'CREATE_MP_PREFERENCE',
      total: amountToPay.toString(),
      currency_id: selectedCurrency,
      email: formData.email,
      title: title
    });

    try {
      addLog(`🚀 INICIANDO PREFERENCIA ${selectedCurrency}...`);
      const res = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`);
      const data = await res.json();

      addLog(`Respuesta Preference: ${JSON.stringify(data)}`);

      if (data.status === 'SUCCESS' && data.preferenceId) {
        setMpPreferenceId(data.preferenceId);
        if (data.init_point) setMpInitPoint(data.init_point);
        setStep(2);
      } else {
        alert("Error al iniciar pago: " + (data.message || JSON.stringify(data)));
      }
    } catch (e: any) {
      console.error(e);
      addLog(`Error Conexión: ${e.message}`);
      alert("Error de conexión con el servidor de pagos.");
    } finally {
      setLoadingToken(false);
    }
  };

  const handleContinue = async () => {
    // Crear preferencia y abrir checkout de MP en nueva pestaña
    if (loadingToken || !formData.email) return;
    setLoadingToken(true);

    const title = cart.map(i => i.name).join(', ').substring(0, 200);
    const amountToPay = getAmountForPayment();

    // Preparar items para el backend - SIN LINKS por seguridad
    // Los links solo se obtienen del backend después de verificar el pago
    const itemsWithPrices = cart.map(i => ({
      id: i.id,
      name: i.name,
      price: selectedCurrency === 'PEN' ? i.price * EXCHANGE_RATE : i.price,
      description: i.description || '',
      imageUrl: i.imageUrl || ''
      // NOTA: NO incluir link aquí por seguridad
    }));

    // Guardar datos del checkout en localStorage para recuperarlos después del pago
    // SEGURIDAD: NO guardamos los links - solo IDs de productos
    // Los links se obtienen del backend SOLO después de verificar el pago
    const checkoutData = {
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        description: i.description || '',
        price: selectedCurrency === 'PEN' ? i.price * EXCHANGE_RATE : i.price,
        // SEGURIDAD: NO incluir link
        imageUrl: i.imageUrl || '',
        fileType: i.fileType || [],
        category: i.category || ''
      })),
      customer: {
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`
      },
      total: amountToPay,
      currency: selectedCurrency,
      timestamp: Date.now()
    };
    
    console.log('💾 Guardando checkout data:', checkoutData);
    
    // Guardar en múltiples lugares para redundancia
    const checkoutDataStr = JSON.stringify(checkoutData);
    localStorage.setItem('gestiosafe_pending_checkout', checkoutDataStr);
    sessionStorage.setItem('gestiosafe_pending_checkout', checkoutDataStr);
    
    // También guardar en cookie como fallback (funciona entre www y non-www si se configura el dominio correctamente)
    // IMPORTANTE: Usar domain=.gestiosafe.com para que funcione entre www y non-www
    const isProduction = window.location.hostname.includes('gestiosafe.com');
    if (isProduction) {
      document.cookie = `gestiosafe_checkout=${encodeURIComponent(checkoutDataStr)}; path=/; max-age=3600; domain=.gestiosafe.com; SameSite=Lax`;
    } else {
      document.cookie = `gestiosafe_checkout=${encodeURIComponent(checkoutDataStr)}; path=/; max-age=3600; SameSite=Lax`;
    }
    
    addLog('💾 Datos guardados en localStorage, sessionStorage y cookie');

    // La URL de retorno - SIEMPRE usar https://www.gestiosafe.com para consistencia
    // Esto asegura que localStorage/sessionStorage funcionen correctamente
    let backUrl: string;
    
    const currentHost = window.location.hostname;
    if (currentHost.includes('gestiosafe.com')) {
      // En producción, siempre usar el dominio con www para consistencia
      backUrl = 'https://www.gestiosafe.com';
    } else if (currentHost === 'localhost' || currentHost.startsWith('192.168') || currentHost.startsWith('127.')) {
      // En desarrollo local, usar la URL de producción para el retorno
      backUrl = 'https://www.gestiosafe.com';
    } else {
      // Fallback
      backUrl = 'https://www.gestiosafe.com';
    }
    
    addLog(`🔗 Back URL (normalizada): ${backUrl}`);

    const query = new URLSearchParams({
      action: 'CREATE_MP_PREFERENCE',
      total: amountToPay.toString(),
      currency_id: selectedCurrency,
      email: formData.email,
      customer_name: `${formData.firstName} ${formData.lastName}`,
      title: title,
      back_url: backUrl,
      items: encodeURIComponent(JSON.stringify(itemsWithPrices))
    });

    try {
      addLog(`🚀 Creando preferencia de pago...`);
      const res = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`);
      const data = await res.json();

      if (data.status === 'SUCCESS' && data.init_point) {
        addLog(`✅ Preferencia creada: ${data.preferenceId}`);
        setMpPreferenceId(data.preferenceId);
        setMpInitPoint(data.init_point);
        
        // Redirigir al checkout de MP en la misma ventana
        // Cuando el usuario complete el pago, MP lo redirigirá de vuelta aquí con los parámetros
        window.location.href = data.init_point;
        
      } else {
        alert("Error al iniciar pago: " + (data.message || JSON.stringify(data)));
      }
    } catch (e: any) {
      console.error(e);
      addLog(`Error: ${e.message}`);
      alert("Error de conexión con el servidor de pagos.");
    } finally {
      setLoadingToken(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md">
      {step === 2 ? (
        // Step 2: Esperando que el usuario complete el pago en MP - Optimizado para móvil
        <div className="bg-white w-full max-w-lg mx-4 rounded-2xl lg:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300 max-h-[90vh]">
          <div className="p-4 lg:p-6 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-600 to-cyan-500">
            <div className="flex items-center gap-3">
              <div className="size-10 lg:size-12 bg-white/20 rounded-xl lg:rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl lg:text-2xl">lock</span>
              </div>
              <div>
                <h2 className="text-base lg:text-xl font-black text-white">Pago en Proceso</h2>
                <p className="text-[10px] lg:text-xs text-white/80 font-medium">Mercado Pago</p>
              </div>
            </div>
            <button onClick={() => setStep(1)} className="size-9 lg:size-10 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-white text-xl">close</span>
            </button>
          </div>
          
          <div className="p-5 lg:p-8 flex flex-col items-center text-center space-y-4 lg:space-y-6 overflow-y-auto">
            <div className="size-14 lg:size-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-2xl lg:text-4xl animate-pulse">open_in_new</span>
            </div>
            
            <div>
              <h3 className="text-lg lg:text-2xl font-black text-slate-800 mb-1 lg:mb-2">Completa tu pago</h3>
              <p className="text-slate-500 text-xs lg:text-base">Fuiste redirigido a Mercado Pago.</p>
              <p className="text-slate-500 text-xs lg:text-base">Al terminar, vuelve aquí.</p>
            </div>

            <div className="bg-slate-50 p-3 lg:p-4 rounded-xl w-full">
              <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase mb-1">Total a pagar</p>
              {DISCOUNT_PERCENT > 0 ? (
                <div className="space-y-0.5">
                  <p className="text-sm lg:text-lg text-slate-400 line-through">{getCurrencySymbol()} {getTotalInCurrency().toFixed(2)}</p>
                  <p className="text-2xl lg:text-3xl font-black text-green-600">{getCurrencySymbol()} {getFinalTotal().toFixed(2)}</p>
                  <p className="text-[10px] lg:text-xs font-bold text-green-500">¡Ahorraste {getCurrencySymbol()} {getDiscountAmount().toFixed(2)}!</p>
                </div>
              ) : (
                <p className="text-2xl lg:text-3xl font-black text-slate-900">{getCurrencySymbol()} {getTotalInCurrency().toFixed(2)}</p>
              )}
            </div>

            {/* Campo para número de operación */}
            <div className="w-full space-y-1.5">
              <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase">Número de Operación</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 1344393167"
                  value={paymentIdInput}
                  onChange={(e) => setPaymentIdInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 p-3 lg:p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-center text-base lg:text-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                />
              </div>
              <p className="text-[9px] lg:text-[10px] text-slate-400 text-center">
                Encuéntralo en la pantalla de confirmación (después del #)
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              {mpInitPoint && (
                <button 
                  onClick={() => window.open(mpInitPoint, '_blank')}
                  className="w-full py-3 lg:py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all text-sm lg:text-base"
                >
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                  Abrir checkout
                </button>
              )}
              
              <button 
                onClick={verifyByPaymentId}
                disabled={verifyingPayment || !paymentIdInput.trim()}
                className="w-full py-3 lg:py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all text-sm lg:text-base"
              >
                {verifyingPayment ? (
                  <>
                    <div className="size-4 lg:size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Verificar mi pago
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setStep(1)}
                className="w-full py-2.5 lg:py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-bold rounded-xl transition-all text-sm"
              >
                Cancelar y volver
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Step 1 y 3: Layout normal con sidebar
        <div className="bg-white w-full max-w-6xl rounded-2xl lg:rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in zoom-in duration-300 max-h-[95vh] lg:max-h-[90vh]">
          <div className="flex-1 p-4 lg:p-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 lg:mb-10">
            <h2 className="text-xl lg:text-4xl font-black text-slate-900 tracking-tight">Checkout</h2>
            <button onClick={onClose} className="size-9 lg:size-10 hover:bg-slate-100 active:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-xl lg:text-2xl">close</span>
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-3 lg:space-y-6 animate-in slide-in-from-left duration-300">
              <div className="grid grid-cols-2 gap-2 lg:gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 ml-2">Nombres</label>
                  <input type="text" name="firstName" autoComplete="given-name" placeholder="Nombres" className="w-full p-2.5 lg:p-5 bg-slate-50 border-none rounded-xl lg:rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 ml-2">Apellidos</label>
                  <input type="text" name="lastName" autoComplete="family-name" placeholder="Apellidos" className="w-full p-2.5 lg:p-5 bg-slate-50 border-none rounded-xl lg:rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 ml-2">Correo Electrónico</label>
                <input type="email" name="email" autoComplete="email" placeholder="ejemplo@correo.com" className="w-full p-2.5 lg:p-5 bg-slate-50 border-none rounded-xl lg:rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 ml-2">DNI / RUC</label>
                  <input type="text" name="docNumber" autoComplete="off" placeholder="Documento" className="w-full p-2.5 lg:p-5 bg-slate-50 border-none rounded-xl lg:rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.docNumber} onChange={e => setFormData({ ...formData, docNumber: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 ml-2">Teléfono</label>
                  <input type="tel" name="phone" autoComplete="tel" placeholder="Teléfono" className="w-full p-2.5 lg:p-5 bg-slate-50 border-none rounded-xl lg:rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              {/* SELECCIÓN DE MONEDA */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 ml-2">Moneda de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('PEN')}
                    className={`p-2.5 lg:p-5 rounded-xl lg:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 active:scale-95 ${selectedCurrency === 'PEN' ? 'bg-white border-pragmo-blue text-pragmo-blue shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <span className="text-base lg:text-2xl">🇵🇪</span>
                    <div className="text-left leading-tight">
                      <p className="text-[10px] lg:text-xs font-black">SOLES</p>
                      <p className="text-[8px] lg:text-[10px] opacity-75">S/ {(total * EXCHANGE_RATE).toFixed(2)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('USD')}
                    className={`p-2.5 lg:p-5 rounded-xl lg:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 active:scale-95 ${selectedCurrency === 'USD' ? 'bg-white border-green-500 text-green-600 shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <span className="text-base lg:text-2xl">🇺🇸</span>
                    <div className="text-left leading-tight">
                      <p className="text-[10px] lg:text-xs font-black">USD</p>
                      <p className="text-[8px] lg:text-[10px] opacity-75">$ {total.toFixed(2)}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Resumen móvil del pedido */}
              <div className="lg:hidden bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tu Pedido ({cart.length})</span>
                  <span className="text-sm font-black text-slate-900">{getCurrencySymbol()} {getFinalTotal().toFixed(2)}</span>
                </div>
                {DISCOUNT_PERCENT > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="material-symbols-outlined text-sm">local_offer</span>
                    <span className="text-[10px] font-bold">-{DISCOUNT_PERCENT}% descuento aplicado</span>
                  </div>
                )}
              </div>

              <button onClick={handleContinue} disabled={loadingToken || !formData.email || !formData.firstName} className="w-full py-3.5 lg:py-6 bg-pragmo-blue hover:bg-blue-800 text-white font-black rounded-xl lg:rounded-3xl shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm lg:text-lg">
                {loadingToken ? (
                  <div className="size-5 lg:size-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock</span>
                    Pagar {getCurrencySymbol()} {getFinalTotal().toFixed(2)}
                    {DISCOUNT_PERCENT > 0 && <span className="ml-1 bg-yellow-400 text-yellow-900 text-[9px] lg:text-xs px-1.5 py-0.5 rounded-full">-{DISCOUNT_PERCENT}%</span>}
                  </>
                )}
              </button>
            </div>
          )}


          {step === 2 && !isOpen && false && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-blue-500 text-white rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">payments</span></div>
                  <div><p className="text-sm font-black text-slate-800">Mercado Pago</p><p className="text-[10px] font-bold text-slate-400 uppercase">Procesando en {selectedCurrency}</p></div>
                </div>
                <button onClick={() => setStep(1)} className="text-[10px] font-black text-pragmo-blue uppercase underline">Cambiar datos</button>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] flex flex-col w-full" style={{ height: 'calc(95vh - 120px)', minHeight: '600px' }}>
                {mpPreferenceId && mpInitPoint ? (
                  <div className="w-full flex-1 flex flex-col relative">
                    <div className="absolute inset-0 bg-white flex items-center justify-center" id="iframe-fallback" style={{ display: 'none' }}>
                      <div className="text-center">
                        <p className="text-slate-600 font-bold mb-4">Abriendo Mercado Pago...</p>
                        <button
                          onClick={() => {
                            window.open(mpInitPoint, 'mp_checkout', 'width=980,height=720,left=150,top=150');
                            addLog('Checkout abierto en popup');
                          }}
                          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl"
                        >
                          Abrir Checkout (Popup)
                        </button>
                      </div>
                    </div>
                    <iframe 
                      title="mp-checkout-secure" 
                      src={mpInitPoint} 
                      style={{
                        width: '100%', 
                        height: '100%', 
                        border: '0',
                        display: 'block',
                        borderRadius: '1.5rem'
                      }}
                      allow="payment microphone camera"
                      onLoad={() => {
                        addLog('✅ iframe cargado correctamente');
                        const fallback = document.getElementById('iframe-fallback');
                        if (fallback) fallback.style.display = 'none';
                      }}
                      onError={() => {
                        addLog('❌ iframe bloqueado por Mercado Pago. Mostrando fallback popup.');
                        const fallback = document.getElementById('iframe-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center flex items-center justify-center h-full">
                    <div>
                      <div className="size-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-500 font-bold">Generando preferencia de pago...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 lg:space-y-6 animate-in slide-in-from-right duration-500">
              {/* Header de éxito */}
              <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-5 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                <div className="relative">
                  <div className="size-16 lg:size-24 bg-white text-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-900/30 animate-bounce">
                    <span className="material-symbols-outlined text-3xl lg:text-5xl">check_circle</span>
                  </div>
                </div>
                <div className="relative">
                  <h2 className="text-xl lg:text-3xl font-black text-white drop-shadow-lg">¡Pago Exitoso!</h2>
                  <p className="text-white/90 font-medium text-sm lg:text-base mt-1">Gracias, <span className="font-bold">{formData.firstName}</span></p>
                  <p className="text-white/70 text-xs lg:text-sm mt-0.5">Confirmación enviada a {formData.email}</p>
                </div>
              </div>

              {/* Sección de descargas */}
              <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[2.5rem] border-2 border-slate-100 shadow-lg">
                <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
                  <div className="size-10 lg:size-12 bg-blue-100 text-blue-600 rounded-xl lg:rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl lg:text-2xl">folder_zip</span>
                  </div>
                  <div>
                    <h3 className="text-sm lg:text-lg font-black text-slate-800">Tus Recursos</h3>
                    <p className="text-[10px] lg:text-xs text-slate-400">Descarga ahora</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="group relative bg-gradient-to-br from-slate-50 to-white rounded-xl lg:rounded-2xl border-2 border-slate-100 overflow-hidden">
                      <div className="relative p-3 lg:p-5">
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="size-14 lg:size-20 rounded-lg lg:rounded-xl object-cover shadow-lg"
                            />
                            <div className="absolute -bottom-1 -right-1 size-5 lg:size-8 bg-green-500 text-white rounded-md lg:rounded-lg flex items-center justify-center shadow-lg">
                              <span className="material-symbols-outlined text-xs lg:text-sm">verified</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold lg:font-black text-slate-800 text-sm lg:text-lg leading-tight line-clamp-2">{item.name}</h4>
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[8px] lg:text-[10px] font-black uppercase">
                                ✓ Pagado
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {item.link && item.link !== '#' && item.link.startsWith('http') ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 w-full flex items-center justify-center gap-2 py-3 lg:py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold lg:font-black rounded-lg lg:rounded-xl shadow-lg transition-all active:scale-[0.97] text-sm"
                          >
                            <span className="material-symbols-outlined text-lg lg:text-xl">cloud_download</span>
                            <span>Descargar</span>
                          </a>
                        ) : (
                          <div className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-600 font-bold rounded-lg border border-amber-200 text-xs lg:text-sm">
                            <span className="material-symbols-outlined text-base">mail</span>
                            <span>Link en tu correo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mensaje informativo */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">info</span>
                <div className="text-xs lg:text-sm">
                  <p className="font-bold text-blue-800">Guarda estos enlaces</p>
                  <p className="text-blue-600">También fueron enviados a tu correo.</p>
                </div>
              </div>

              <button onClick={() => { clearCart(); onClose(); }} className="w-full py-4 lg:py-5 bg-slate-900 text-white font-black rounded-xl lg:rounded-3xl hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 text-sm lg:text-base">
                <span className="material-symbols-outlined">check</span>
                Cerrar
              </button>
            </div>
          )}
        </div>

        <div className={`${step === 2 ? 'hidden' : 'hidden lg:flex lg:w-[380px]'} bg-slate-50 p-8 lg:p-10 flex-col border-l border-slate-100`}>
          <h4 className="font-black text-xs uppercase text-slate-400 mb-6 tracking-[0.2em]">Tu Pedido</h4>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-2">
            {cart.map(item => {
              const itemPrice = selectedCurrency === 'PEN' ? item.price * EXCHANGE_RATE : item.price;

              return (
                <div key={item.id} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group">
                  <img src={item.imageUrl} className="size-14 rounded-lg object-cover" alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-xs font-black text-pragmo-blue mt-0.5">{getCurrencySymbol()} {itemPrice.toFixed(2)}</p>
                  </div>
                  {step === 1 && (<button onClick={() => removeFromCart(item.id)} className="size-8 text-slate-200 hover:text-red-500 transition-colors shrink-0"><span className="material-symbols-outlined text-lg">delete</span></button>)}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            {/* Banner de descuento */}
            {DISCOUNT_PERCENT > 0 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-20">🔥</div>
                <div className="relative">
                  <p className="font-black text-sm">{PROMO_NAME}</p>
                  <p className="text-[10px] opacity-90">{PROMO_MESSAGE}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black">-{DISCOUNT_PERCENT}%</span>
                    <span className="text-[10px]">Ahorras {getCurrencySymbol()} {getDiscountAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Final</span>
                {DISCOUNT_PERCENT > 0 ? (
                  <div>
                    <span className="text-lg text-slate-400 line-through mr-2">{getCurrencySymbol()} {getTotalInCurrency().toFixed(2)}</span>
                    <span className="text-2xl font-black text-green-600">{getCurrencySymbol()} {getFinalTotal().toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-black text-slate-900">{getCurrencySymbol()} {getTotalInCurrency().toFixed(2)}</span>
                )}
                {selectedCurrency === 'PEN' && <p className="text-[9px] text-slate-400 mt-0.5">T.C. S/ {EXCHANGE_RATE.toFixed(2)}</p>}
              </div>
              <div className="text-right"><p className="text-[9px] font-bold text-slate-400">{cart.length} items</p></div>
            </div>

            {/* Debug console - oculto en móvil */}
            <div className="hidden lg:block mt-4 bg-slate-900 rounded-lg p-3 h-[120px] overflow-y-auto font-mono text-[9px] border border-slate-800">
              <p className="text-slate-500 font-bold mb-1 uppercase tracking-widest border-b border-slate-700 pb-1">Debug</p>
              {logs.length === 0 ? (<p className="text-slate-600 italic">Esperando...</p>) : (logs.slice(-5).map((log, i) => (<p key={i} className="text-green-400 mb-0.5 break-all"><span className="text-slate-500 mr-1 opacity-50">&gt;</span>{log}</p>)))}
            </div>
          </div>
        </div>
        </div>
      )}
    </div >
  );
};

export default CheckoutModal;
