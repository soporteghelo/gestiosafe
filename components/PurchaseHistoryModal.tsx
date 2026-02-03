import React, { useState } from 'react';
import { usePurchaseHistory, Purchase } from '../context/PurchaseHistoryContext';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({ isOpen, onClose }) => {
  const { purchases, hasPurchases } = usePurchaseHistory();
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return currency === 'PEN' 
      ? `S/ ${price.toFixed(2)}`
      : `$ ${price.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-500">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Mis Compras</h2>
              <p className="text-xs text-white/80 font-medium">
                {purchases.length} compra{purchases.length !== 1 ? 's' : ''} en esta sesión
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="size-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasPurchases ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-slate-400 text-4xl">shopping_bag</span>
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Sin compras aún</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Las compras que realices en esta sesión aparecerán aquí con sus links de descarga.
              </p>
              <p className="text-xs text-slate-400 mt-4 bg-amber-50 px-4 py-2 rounded-lg">
                ⚠️ El historial se borra al cerrar el navegador
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Purchase Header */}
                  <div 
                    className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedPurchase(
                      expandedPurchase === purchase.id ? null : purchase.id
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {purchase.items.length} producto{purchase.items.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(purchase.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-emerald-600">
                        {formatPrice(purchase.total, purchase.currency)}
                      </span>
                      <span className="material-symbols-outlined text-slate-400">
                        {expandedPurchase === purchase.id ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </div>

                  {/* Purchase Details */}
                  {expandedPurchase === purchase.id && (
                    <div className="p-4 border-t border-slate-200 space-y-3">
                      {purchase.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100"
                        >
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="size-14 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{item.category}</p>
                            <p className="text-xs font-bold text-slate-600 mt-1">
                              {formatPrice(item.price, purchase.currency)}
                            </p>
                          </div>
                          {item.link && item.link !== '#' && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">download</span>
                              Descargar
                            </a>
                          )}
                        </div>
                      ))}

                      {/* Payment ID */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">ID de pago:</span>
                        <span className="text-xs font-mono text-slate-500">{purchase.paymentId}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Warning */}
              <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600">info</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Historial temporal</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Este historial solo está disponible durante esta sesión del navegador. 
                      Te recomendamos descargar tus archivos ahora.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistoryModal;
