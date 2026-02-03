import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
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
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [message, setMessage] = useState('Verificando tu pago...');

  useEffect(() => {
    const verifyPaymentFromURL = async () => {
      // Obtener parámetros de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get('payment_id');
      const paymentStatus = urlParams.get('status');
      const preferenceId = urlParams.get('preference_id');
      const externalReference = urlParams.get('external_reference');

      console.log('🔍 Parámetros de URL:', { paymentId, paymentStatus, preferenceId, externalReference });

      if (!paymentId) {
        setStatus('error');
        setMessage('No se encontró información del pago en la URL.');
        return;
      }

      // Si el status de la URL ya dice que fue aprobado
      if (paymentStatus === 'approved') {
        try {
          // Recuperar datos del carrito de localStorage si no están en memoria
          let cartItems = cart;
          let customerData = { email: '', name: '' };

          // Intentar recuperar de localStorage
          const savedCheckout = localStorage.getItem('gestiosafe_pending_checkout');
          if (savedCheckout) {
            const parsed = JSON.parse(savedCheckout);
            cartItems = parsed.items || cart;
            customerData = parsed.customer || { email: '', name: '' };
          }

          // Preparar items para backend
          const itemsForBackend = cartItems.map((item: any) => ({
            name: item.name,
            price: item.price,
            link: item.link || ''
          }));

          // Verificar con el backend
          const query = new URLSearchParams({
            action: 'VERIFY_BY_PAYMENT_ID',
            payment_id: paymentId,
            email: customerData.email,
            customer_name: customerData.name,
            items: encodeURIComponent(JSON.stringify(itemsForBackend))
          });

          const res = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`);
          const data = await res.json();

          console.log('📥 Respuesta verificación:', data);
          console.log('🛒 Cart Items recuperados:', cartItems);

          if (data.status === 'approved') {
            setPaymentData(data);
            setStatus('success');
            setMessage('¡Pago exitoso!');
            
            // Guardar los items comprados con todos sus datos
            console.log('🔗 Procesando items comprados...');
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

            // Limpiar localStorage y carrito
            localStorage.removeItem('gestiosafe_pending_checkout');
            
            // Limpiar parámetros de URL sin recargar
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
        setMessage('Tu pago está pendiente de confirmación. Te notificaremos cuando se confirme.');
      } else {
        setStatus('error');
        setMessage('El pago no fue completado. Por favor intenta nuevamente.');
      }
    };

    verifyPaymentFromURL();
  }, [cart]);

  const handleClose = () => {
    // Limpiar URL
    window.history.replaceState({}, '', window.location.pathname);
    if (status === 'success') {
      clearCart();
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        {/* Header */}
        <div className={`p-6 flex items-center justify-between border-b ${
          status === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
          status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
          status === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
          'bg-gradient-to-r from-blue-600 to-cyan-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">
                {status === 'success' ? 'check_circle' :
                 status === 'pending' ? 'schedule' :
                 status === 'error' ? 'error' : 'sync'}
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
        <div className="p-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <div className="size-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium">{message}</p>
            </div>
          )}

          {status === 'success' && (
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
                  {paymentData.amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Monto:</span>
                      <span className="font-bold text-slate-800">{paymentData.currency} {paymentData.amount}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Items Comprados con Links de Descarga */}
              {purchasedItems.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">shopping_bag</span>
                    Tus Productos ({purchasedItems.length})
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {purchasedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 rounded-xl p-4 hover:border-green-300 transition-all"
                      >
                        <div className="flex gap-4">
                          {/* Imagen */}
                          <div className="flex-shrink-0">
                            <img 
                              src={item.imageUrl || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=80&h=80&fit=crop'} 
                              alt={item.name}
                              className="size-16 rounded-lg object-cover border-2 border-slate-200"
                            />
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-slate-800 text-sm truncate">{item.name}</h5>
                            {item.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {item.category && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.category}</span>
                              )}
                              {item.fileType && item.fileType.length > 0 && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  {Array.isArray(item.fileType) ? item.fileType.join(', ') : item.fileType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón de Descarga */}
                        {item.link && item.link !== '#' && item.link !== '' ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                          >
                            <span className="material-symbols-outlined">download</span>
                            Descargar Archivo
                          </a>
                        ) : (
                          <div className="mt-3 flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-500 font-medium rounded-xl">
                            <span className="material-symbols-outlined text-sm">mail</span>
                            Link enviado por correo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-2xl">
                <p className="text-xs text-blue-600 text-center">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">mail</span>
                  También recibirás los enlaces de descarga en tu correo electrónico.
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
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleClose}
            className={`w-full py-4 font-black rounded-2xl transition-all ${
              status === 'success' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {status === 'success' ? 'Continuar Navegando' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
