import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { APPS_SCRIPT_URL, MERCADOPAGO_PUBLIC_KEY, EXCHANGE_RATE } from '../config';

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

  const getAmountForPayment = () => {
    return Number(getTotalInCurrency().toFixed(2));
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
      // Preparar los items para enviar al backend
      const itemsForBackend = cart.map(item => ({
        name: item.name,
        price: selectedCurrency === 'PEN' ? item.price * EXCHANGE_RATE : item.price,
        link: item.link || ''
      }));

      const query = new URLSearchParams({
        action: 'VERIFY_BY_PAYMENT_ID',
        payment_id: paymentIdInput.trim(),
        email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        items: encodeURIComponent(JSON.stringify(itemsForBackend))
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
      // Preparar los items para enviar al backend
      const itemsForBackend = cart.map(item => ({
        name: item.name,
        price: selectedCurrency === 'PEN' ? item.price * EXCHANGE_RATE : item.price,
        link: item.link || ''
      }));

      const query = new URLSearchParams({
        action: 'VERIFY_PAYMENT',
        preference_id: mpPreferenceId,
        email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        items: encodeURIComponent(JSON.stringify(itemsForBackend))
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

    // Preparar items con precios en la moneda seleccionada
    const itemsWithPrices = cart.map(i => ({
      name: i.name,
      price: selectedCurrency === 'PEN' ? i.price * EXCHANGE_RATE : i.price,
      link: i.link || '',
      description: i.description || '',
      imageUrl: i.imageUrl || ''
    }));

    // Guardar datos del checkout en localStorage para recuperarlos después del pago
    // IMPORTANTE: Guardar todos los datos necesarios para mostrar después del pago
    const checkoutData = {
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        description: i.description || '',
        price: selectedCurrency === 'PEN' ? i.price * EXCHANGE_RATE : i.price,
        link: i.link || '',
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
    
    // También guardar en cookie como fallback (funciona entre www y non-www)
    document.cookie = `gestiosafe_checkout=${encodeURIComponent(checkoutDataStr)}; path=/; max-age=3600; SameSite=Lax`;
    
    addLog('💾 Datos guardados en localStorage, sessionStorage y cookie');

    // La URL de retorno - asegurar que sea una URL válida completa
    let backUrl = window.location.origin + window.location.pathname;
    // Si estamos en localhost, usar localhost con puerto
    if (!backUrl || backUrl === 'null' || !backUrl.startsWith('http')) {
      backUrl = window.location.href.split('?')[0]; // URL actual sin parámetros
    }
    // Asegurar que sea una URL válida para MP
    if (!backUrl.startsWith('http')) {
      backUrl = 'https://gestiosafe.com'; // Fallback a producción
    }
    addLog(`🔗 Back URL: ${backUrl}`);

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
        // Step 2: Esperando que el usuario complete el pago en MP
        <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-600 to-cyan-500">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">lock</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Pago en Proceso</h2>
                <p className="text-xs text-white/80 font-medium">Mercado Pago</p>
              </div>
            </div>
            <button onClick={() => setStep(1)} className="size-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-white">close</span>
            </button>
          </div>
          
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="size-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-4xl animate-pulse">open_in_new</span>
            </div>
            
            <div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Completa tu pago</h3>
              <p className="text-slate-500">Se abrió una nueva pestaña con el checkout de Mercado Pago.</p>
              <p className="text-slate-500 mt-1">Completa el pago y regresa aquí.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl w-full">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total a pagar</p>
              <p className="text-3xl font-black text-slate-900">{getCurrencySymbol()} {getTotalInCurrency().toFixed(2)}</p>
            </div>

            {/* Campo para número de operación */}
            <div className="w-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Número de Operación</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: 1344393167"
                  value={paymentIdInput}
                  onChange={(e) => setPaymentIdInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-center text-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Encuéntralo en la pantalla de confirmación de Mercado Pago (después del #)
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {mpInitPoint && (
                <button 
                  onClick={() => window.open(mpInitPoint, '_blank')}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  Abrir checkout de nuevo
                </button>
              )}
              
              <button 
                onClick={verifyByPaymentId}
                disabled={verifyingPayment || !paymentIdInput.trim()}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                {verifyingPayment ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verificando pago...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">verified</span>
                    Verificar mi pago
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setStep(1)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
              >
                Cancelar y volver
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Step 1 y 3: Layout normal con sidebar
        <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in duration-300" style={{ maxHeight: '95vh' }}>
          <div className="flex-1 p-8 lg:p-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Checkout</h2>
            <button onClick={onClose} className="size-10 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombres</label>
                  <input type="text" name="firstName" autoComplete="given-name" placeholder="Escribe tus nombres" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Apellidos</label>
                  <input type="text" name="lastName" autoComplete="family-name" placeholder="Escribe tus apellidos" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Correo Electrónico</label>
                <input type="email" name="email" autoComplete="email" placeholder="ejemplo@correo.com" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">DNI / RUC</label>
                <input type="text" name="docNumber" autoComplete="off" placeholder="Número de documento" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.docNumber} onChange={e => setFormData({ ...formData, docNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Teléfono</label>
                <input type="tel" name="phone" autoComplete="tel" placeholder="Número de teléfono" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-pragmo-blue" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              {/* SELECCIÓN DE MONEDA */}
              <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Moneda de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('PEN')}
                    className={`p-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border-2 ${selectedCurrency === 'PEN' ? 'bg-white border-pragmo-blue text-pragmo-blue shadow-xl shadow-blue-500/10' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <span className="text-2xl">🇵🇪</span>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black">SOLES</p>
                      <p className="text-[10px] opacity-75">S/ {(total * EXCHANGE_RATE).toFixed(2)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('USD')}
                    className={`p-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border-2 ${selectedCurrency === 'USD' ? 'bg-white border-green-500 text-green-600 shadow-xl shadow-green-500/10' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <span className="text-2xl">🇺🇸</span>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black">DÓLARES</p>
                      <p className="text-[10px] opacity-75">$ {total.toFixed(2)}</p>
                    </div>
                  </button>
                </div>
              </div>

              <button onClick={handleContinue} disabled={loadingToken || !formData.email || !formData.firstName} className="w-full py-6 bg-pragmo-blue hover:bg-blue-800 text-white font-black rounded-3xl shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg mt-8">
                {loadingToken ? (<div className="size-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>) : (<>Continuar al Pago ({getCurrencySymbol()} {getTotalInCurrency().toFixed(2)})</>)}
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
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              {/* Header de éxito */}
              <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                <div className="relative">
                  <div className="size-24 bg-white text-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-900/30 animate-bounce">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                  </div>
                </div>
                <div className="relative">
                  <h2 className="text-3xl font-black text-white drop-shadow-lg">¡Pago Exitoso!</h2>
                  <p className="text-white/90 font-medium mt-2">Gracias por tu compra, <span className="font-bold">{formData.firstName}</span></p>
                  <p className="text-white/70 text-sm mt-1">Un correo de confirmación fue enviado a {formData.email}</p>
                </div>
              </div>

              {/* Sección de descargas */}
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">folder_zip</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Tus Recursos Digitales</h3>
                    <p className="text-xs text-slate-400">Descarga tus archivos ahora mismo</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="group relative bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
                      {/* Imagen de fondo decorativa */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      
                      <div className="relative p-5">
                        <div className="flex items-start gap-4">
                          {/* Imagen del producto */}
                          <div className="relative">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="size-20 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute -bottom-2 -right-2 size-8 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                              <span className="material-symbols-outlined text-sm">verified</span>
                            </div>
                          </div>
                          
                          {/* Info del producto */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-800 text-lg leading-tight line-clamp-2 mb-2">{item.name}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.fileType?.map((type, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase">
                                  {type}
                                </span>
                              ))}
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase">
                                ✓ Pagado
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                        
                        {/* Botón de descarga grande y llamativo */}
                        {item.link && item.link !== '#' && item.link.startsWith('http') ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 group/btn"
                          >
                            <span className="material-symbols-outlined text-xl group-hover/btn:animate-bounce">cloud_download</span>
                            <span>Descargar Ahora</span>
                            <span className="material-symbols-outlined text-lg opacity-50">arrow_forward</span>
                          </a>
                        ) : (
                          <div className="mt-4 w-full flex items-center justify-center gap-2 py-4 bg-amber-50 text-amber-600 font-bold rounded-xl border border-amber-200">
                            <span className="material-symbols-outlined">mail</span>
                            <span>Link será enviado a tu correo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mensaje informativo */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-500">info</span>
                <div className="text-sm">
                  <p className="font-bold text-blue-800">Guarda estos enlaces</p>
                  <p className="text-blue-600">Los links de descarga también fueron enviados a tu correo electrónico.</p>
                </div>
              </div>

              <button onClick={() => { clearCart(); onClose(); }} className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">check</span>
                Cerrar y Continuar Comprando
              </button>
            </div>
          )}
        </div>

        <div className={`${step === 2 ? 'hidden' : 'w-full md:w-[420px]'} bg-slate-50 p-10 lg:p-14 flex flex-col border-l border-slate-100`}>
          <h4 className="font-black text-xs uppercase text-slate-400 mb-10 tracking-[0.2em]">Tu Pedido</h4>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2">
            {cart.map(item => {
              // Si la moneda seleccionada es PEN, mostramos precio convertido. Si es USD, precio base.
              // Asumimos item.price es USD.
              const itemPrice = selectedCurrency === 'PEN' ? item.price * EXCHANGE_RATE : item.price;

              return (
                <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                  <img src={item.imageUrl} className="size-16 rounded-xl object-cover" alt={item.name} />
                  <div className="flex-1">
                    <p className="text-[13px] font-black text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-[13px] font-black text-pragmo-blue mt-0.5">{getCurrencySymbol()} {itemPrice.toFixed(2)}</p>
                  </div>
                  {step === 1 && (<button onClick={() => removeFromCart(item.id)} className="size-8 text-slate-200 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>)}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Final</span>
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{getCurrencySymbol()} {getTotalInCurrency().toFixed(2)}</span>
                {selectedCurrency === 'PEN' && <p className="text-[10px] text-slate-400 mt-1">T.C. Referencial S/ {EXCHANGE_RATE.toFixed(2)}</p>}
              </div>
              <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase">Artículos: {cart.length}</p></div>
            </div>

            <div className="mt-6 bg-slate-900 rounded-xl p-4 h-[150px] overflow-y-auto font-mono text-[10px] border border-slate-800 shadow-inner">
              <p className="text-slate-500 font-bold mb-2 uppercase tracking-widest border-b border-slate-700 pb-1">Debug Console</p>
              {logs.length === 0 ? (<p className="text-slate-600 italic">Esperando acciones...</p>) : (logs.map((log, i) => (<p key={i} className="text-green-400 mb-1 break-all border-b border-white/5 pb-0.5"><span className="text-slate-500 mr-2 opacity-50">&gt;</span>{log}</p>)))}
            </div>
          </div>
        </div>
        </div>
      )}
    </div >
  );
};

export default CheckoutModal;
