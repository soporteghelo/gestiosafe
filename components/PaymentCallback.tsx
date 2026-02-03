import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { usePurchaseHistory } from '../context/PurchaseHistoryContext';
import { APPS_SCRIPT_URL } from '../config';

interface PaymentCallbackProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchasedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  link: string;
  imageUrl: string;
  fileType: string[];
  category: string;
}

const PaymentCallback: React.FC<PaymentCallbackProps> = ({ onClose, onSuccess }) => {
  const { cart, clearCart } = useCart();
  const { addPurchase } = usePurchaseHistory();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [customerData, setCustomerData] = useState<{ email: string; name: string }>({ email: '', name: '' });
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('PEN');
  const [message, setMessage] = useState('Verificando tu pago...');

  useEffect(() => {
    const verifyPaymentFromURL = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get('payment_id');
      const paymentStatus = urlParams.get('status');

      console.log('🔍 Parámetros de URL:', { paymentId, paymentStatus });

      if (!paymentId) {
        setStatus('error');
        setMessage('No se encontró información del pago en la URL.');
        return;
      }

      if (paymentStatus === 'approved') {
        try {
          let cartItems: any[] = [];
          let customer = { email: '', name: '' };
          let total = 0;
          let curr = 'PEN';

          // Función para obtener cookie
          const getCookie = (name: string): string | null => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
              const val = parts.pop()?.split(';').shift();
              return val ? decodeURIComponent(val) : null;
            }
            return null;
          };

          // Intentar recuperar de múltiples fuentes (por problemas de www vs non-www)
          console.log('🔍 Buscando datos del checkout...');
          
          let savedData: string | null = null;
          
          // 1. Intentar localStorage
          savedData = localStorage.getItem('gestiosafe_pending_checkout');
          if (savedData) console.log('✅ Encontrado en localStorage');
          
          // 2. Si no hay, intentar sessionStorage
          if (!savedData) {
            savedData = sessionStorage.getItem('gestiosafe_pending_checkout');
            if (savedData) console.log('✅ Encontrado en sessionStorage');
          }
          
          // 3. Si no hay, intentar cookie
          if (!savedData) {
            savedData = getCookie('gestiosafe_checkout');
            if (savedData) console.log('✅ Encontrado en cookie');
          }
          
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              cartItems = parsed.items || [];
              customer = parsed.customer || { email: '', name: '' };
              total = parsed.total || 0;
              curr = parsed.currency || 'PEN';
              console.log('📦 Datos recuperados:', parsed);
              console.log('📦 Items encontrados:', cartItems.length);
            } catch (parseError) {
              console.error('❌ Error parseando datos:', parseError);
            }
          } else {
            console.warn('⚠️ No hay datos guardados - intentando recuperar solo del backend');
          }

          // Verificar con el backend - el backend nos dará info del pago
          const query = new URLSearchParams({
            action: 'VERIFY_BY_PAYMENT_ID',
            payment_id: paymentId,
            email: customer.email,
            customer_name: customer.name,
            items: encodeURIComponent(JSON.stringify(cartItems))
          });

          const res = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`);
          const data = await res.json();

          console.log('📥 Respuesta verificación:', data);
          console.log('🛒 Cart Items locales:', cartItems);

          if (data.status === 'approved') {
            setPaymentData(data);
            setStatus('success');
            setMessage('¡Pago exitoso!');

            // Si no tenemos items del localStorage, usar datos del pago
            if (cartItems.length === 0 && data.amount) {
              total = data.amount;
              curr = data.currency || 'PEN';
              customer.email = data.payer_email || '';
            }
            
            // Actualizar con datos del pago de MP
            if (data.amount && total === 0) {
              total = data.amount;
            }
            if (data.currency) {
              curr = data.currency;
            }
            if (data.payer_email && !customer.email) {
              customer.email = data.payer_email;
            }

            setCustomerData(customer);
            setTotalPaid(total);
            setCurrency(curr);

            // Guardar items comprados
            const items: PurchasedItem[] = cartItems.map((item: any) => ({
              id: item.id || '',
              name: item.name || 'Producto',
              description: item.description || '',
              price: item.price || 0,
              link: item.link || '',
              imageUrl: item.imageUrl || '',
              fileType: item.fileType || [],
              category: item.category || ''
            }));

            console.log('✅ Items comprados:', items);
            setPurchasedItems(items);

            // Guardar en historial de compras (sessionStorage)
            addPurchase({
              paymentId: paymentId!,
              items: items.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                link: item.link,
                imageUrl: item.imageUrl,
                category: item.category
              })),
              total: total,
              currency: curr,
              customerEmail: customer.email,
              customerName: customer.name
            });

            // Limpiar URL sin recargar
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            setStatus('pending');
            setMessage(data.message || 'Tu pago está siendo procesado...');
          }
        } catch (error) {
          console.error('Error verificando pago:', error);
          setStatus('error');
          setMessage('Error al verificar el pago. Por favor contacta a soporte.');
        }
      } else if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
        setStatus('pending');
        setMessage('Tu pago está siendo procesado. Te notificaremos cuando se confirme.');
      } else {
        setStatus('error');
        setMessage('El pago no fue completado. Por favor intenta nuevamente.');
      }
    };

    verifyPaymentFromURL();
  }, []);

  const handleViewPurchase = () => {
    setViewMode('details');
  };

  const handleClose = () => {
    clearCart();
    localStorage.removeItem('gestiosafe_pending_checkout');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-3xl">
                {status === 'success' ? 'verified' : status === 'pending' ? 'schedule' : status === 'error' ? 'error' : 'sync'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {status === 'success' ? '¡Pago Exitoso!' :
                 status === 'pending' ? 'Pago Pendiente' :
                 status === 'error' ? 'Error en Pago' : 'Verificando...'}
              </h2>
              <p className="text-xs text-white/80 font-medium">Mercado Pago</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {status === 'loading' && (
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <div className="size-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium">{message}</p>
            </div>
          )}

          {status === 'success' && viewMode === 'summary' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="size-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-600 text-5xl">verified</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">¡Gracias por tu compra!</h3>
                <p className="text-slate-500">Tu pago ha sido procesado correctamente.</p>
              </div>

              {paymentData && (
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">N° Operación:</span>
                    <span className="font-bold text-slate-800">{paymentData.payment_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monto:</span>
                    <span className="font-bold text-slate-800">{currency} {totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="font-bold text-slate-800">{customerData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Productos:</span>
                    <span className="font-bold text-green-600">{purchasedItems.length} item(s)</span>
                  </div>
                </div>
              )}

              <div className="bg-green-50 border-2 border-green-200 p-4 rounded-2xl">
                <p className="text-sm text-green-700 text-center font-medium">
                  <span className="material-symbols-outlined text-lg align-middle mr-1">download</span>
                  Haz clic en "Ver mi Compra" para acceder a tus archivos de descarga.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && viewMode === 'details' && (
            <div className="space-y-4">
              {/* Resumen rápido */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Compra verificada</p>
                    <p className="text-lg font-black text-slate-800">{currency} {totalPaid.toFixed(2)}</p>
                  </div>
                  <div className="size-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">verified</span>
                  </div>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">inventory_2</span>
                  Tus Productos ({purchasedItems.length})
                </h4>

                {purchasedItems.length > 0 ? (
                  <div className="space-y-3">
                    {purchasedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-green-300 hover:shadow-lg transition-all"
                      >
                        {/* Header del producto */}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={item.imageUrl || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=80&h=80&fit=crop'}
                              alt={item.name}
                              className="size-16 rounded-xl object-cover border-2 border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=80&h=80&fit=crop';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-slate-800 leading-tight">{item.name}</h5>
                            {item.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {item.category && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                              )}
                              {item.fileType && item.fileType.length > 0 && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                  {Array.isArray(item.fileType) ? item.fileType.join(', ') : item.fileType}
                                </span>
                              )}
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                S/ {item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botón de descarga */}
                        {item.link && item.link !== '#' && item.link !== '' ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02]"
                          >
                            <span className="material-symbols-outlined">download</span>
                            Descargar Archivo
                          </a>
                        ) : (
                          <div className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-amber-50 border-2 border-amber-200 text-amber-700 font-medium rounded-xl">
                            <span className="material-symbols-outlined text-lg">mail</span>
                            El link será enviado a tu correo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                    <p>No se encontraron productos</p>
                  </div>
                )}
              </div>

              {/* Nota */}
              <div className="bg-blue-50 p-4 rounded-2xl">
                <p className="text-xs text-blue-600 text-center">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">mail</span>
                  También recibirás los enlaces de descarga en <strong>{customerData.email}</strong>
                </p>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="text-center space-y-4 py-4">
              <div className="size-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-yellow-600 text-5xl">hourglass_top</span>
              </div>
              <h3 className="text-xl font-black text-slate-800">{message}</h3>
              <p className="text-slate-500 text-sm">
                El proceso de verificación puede tomar unos minutos.
                Te enviaremos un correo cuando se confirme.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4 py-4">
              <div className="size-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-red-600 text-5xl">error_outline</span>
              </div>
              <h3 className="text-xl font-black text-slate-800">{message}</h3>
              <p className="text-slate-500 text-sm">
                Si crees que esto es un error, por favor contacta a soporte.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          {status === 'success' && viewMode === 'summary' ? (
            <button
              onClick={handleViewPurchase}
              className="w-full py-4 font-black rounded-2xl transition-all bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              Ver mi Compra
            </button>
          ) : status === 'success' && viewMode === 'details' ? (
            <button
              onClick={handleClose}
              className="w-full py-4 font-black rounded-2xl transition-all bg-slate-800 hover:bg-slate-900 text-white"
            >
              Cerrar y Seguir Navegando
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-4 font-black rounded-2xl transition-all bg-slate-800 hover:bg-slate-900 text-white"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
