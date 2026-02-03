
import React, { useState, useMemo, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { PurchaseHistoryProvider, usePurchaseHistory } from './context/PurchaseHistoryContext';
import { Template } from './types';
import { TEMPLATES as FALLBACK_TEMPLATES } from './constants';
import TemplateCard from './components/TemplateCard';
import CheckoutModal from './components/CheckoutModal';
import PaymentCallback from './components/PaymentCallback';
import PurchaseHistoryModal from './components/PurchaseHistoryModal';
import { APPS_SCRIPT_URL, WHATSAPP_NUMBER, DISCOUNT_PERCENT, PROMO_NAME, PROMO_MESSAGE, HERO_IMAGE_URL } from './config';

const ITEMS_PER_PAGE = 12;

const sanitizeString = (str: any) => {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[<>]/g, '');
};

const TemplateDetailsDrawer: React.FC<{
  template: Template | null;
  onClose: () => void;
  onAddToCart: (t: Template) => void;
}> = ({ template, onClose, onAddToCart }) => {
  const { cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (template) {
      setIsOpen(true);
      // Bloquear scroll del body en móvil
      document.body.style.overflow = 'hidden';
    } else {
      setIsOpen(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [template]);

  if (!template) return null;
  const alreadyInCart = cart.some(item => item.id === template.id);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />
      {/* Mobile: Bottom Sheet / Desktop: Side Drawer */}
      <div className={`fixed z-[120] bg-white shadow-2xl transition-all duration-500 ease-out flex flex-col
        lg:top-0 lg:right-0 lg:h-full lg:w-full lg:max-w-lg lg:rounded-none
        inset-x-0 bottom-0 max-h-[90vh] rounded-t-[2rem]
        ${isOpen ? 'translate-y-0 lg:translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'}`}
      >
        {/* Drag handle móvil */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        <div className="p-4 lg:p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2 lg:gap-3">
            <span className="material-symbols-outlined text-pragmo-blue text-xl lg:text-2xl">description</span>
            <h2 className="font-extrabold text-slate-800 uppercase tracking-tighter text-sm lg:text-base">Detalles</h2>
          </div>
          <button onClick={handleClose} className="size-9 lg:size-10 hover:bg-slate-100 active:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-8">
          <div className="aspect-video rounded-xl lg:rounded-3xl overflow-hidden shadow-lg bg-slate-100">
            <img src={template.imageUrl} className="w-full h-full object-cover" alt={template.name} />
          </div>
          <div className="space-y-3 lg:space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className="bg-pragmo-blue/10 text-pragmo-blue text-[9px] lg:text-[10px] font-bold px-2 lg:px-3 py-1 rounded-lg uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">business</span>
                {template.sector}
              </span>
              <span className="bg-pragmo-green/10 text-pragmo-green text-[9px] lg:text-[10px] font-bold px-2 lg:px-3 py-1 rounded-lg uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">category</span>
                {template.category}
              </span>
              {template.fileType && template.fileType.length > 0 && (
                <span className="bg-orange-100 text-orange-600 text-[9px] lg:text-[10px] font-bold px-2 lg:px-3 py-1 rounded-lg uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">description</span>
                  {Array.isArray(template.fileType) ? template.fileType.join(', ') : template.fileType}
                </span>
              )}
            </div>
            <h1 className="text-lg lg:text-3xl font-black text-slate-900 leading-tight">{template.name}</h1>
            <p className="text-slate-500 text-xs lg:text-sm leading-relaxed">{template.description}</p>
          </div>
        </div>

        <div className="p-4 lg:p-8 border-t border-slate-100 bg-white flex items-center justify-between gap-4 lg:gap-6 safe-area-bottom">
          <div>
            <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase block mb-0.5 lg:mb-1">Inversión</span>
            <p className="text-xl lg:text-3xl font-black text-slate-900">${template.price.toFixed(2)}</p>
          </div>
          <button
            disabled={alreadyInCart}
            onClick={() => { onAddToCart(template); handleClose(); }}
            className={`flex-1 py-3.5 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-base transition-all shadow-lg ${alreadyInCart ? 'bg-slate-100 text-slate-400' : 'bg-pragmo-blue hover:bg-blue-800 text-white active:scale-[0.97]'}`}
          >
            {alreadyInCart ? '✓ Agregado' : 'Añadir al Carrito'}
          </button>
        </div>
      </div>
    </>
  );
};

const AppContent: React.FC = () => {
  const { itemCount, addToCart, clearCart } = useCart();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Estado para detectar retorno de Mercado Pago
  const [showPaymentCallback, setShowPaymentCallback] = useState(false);

  // Detectar parámetros de pago en la URL al cargar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    const collectionStatus = urlParams.get('collection_status') || urlParams.get('status');
    
    if (paymentId && collectionStatus) {
      console.log('🔔 Retorno de Mercado Pago detectado:', { paymentId, collectionStatus });
      setShowPaymentCallback(true);
    }
  }, []);

  const handlePaymentSuccess = () => {
    clearCart();
    showToast('¡Compra completada exitosamente!');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleContactWhatsApp = () => {
    const message = encodeURIComponent("Quiero información sobre Gestiosafe...");
    window.open(`https://wa.me/51983113140?text=${message}`, '_blank');
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=GET_CATALOG`, { redirect: 'follow' });
        if (!response.ok) throw new Error('Error en la red');
        const data = await response.json();

        const mapped = data.map((item: any) => {
          // Buscador flexible de valores para manejar variaciones de nombres de columnas en el Excel
          const getVal = (keys: string[], fallback: string = '') => {
            for (const k of keys) {
              if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '') return String(item[k]);
            }
            return fallback;
          };

          return {
            id: getVal(['id', 'codigo'], String(Math.random())),
            name: sanitizeString(getVal(['nombre', 'name', 'titulo'], 'Plantilla SST')),
            description: sanitizeString(getVal(['descripcion', 'description', 'detalle'], '')),
            price: parseFloat(getVal(['precio', 'price', 'costo'], '0')) || 0,
            category: sanitizeString(getVal(['categoria', 'category', 'categorias', 'categories'], 'General')),
            sector: sanitizeString(getVal(['sector', 'sectores', 'industria'], 'Industrial')),
            fileType: Array.isArray(item.formatos) ? item.formatos : (getVal(['formatos', 'format'], '') ? getVal(['formatos', 'format'], '').split(',') : []),
            imageUrl: sanitizeString(getVal(['imagenurl', 'imageurl', 'imagen', 'image'], 'https://images.unsplash.com/photo-1581092160562-40aa08e78837')),
            isPopular: !!(getVal(['popular'], '') === 'SI' || item.ispopular || item.popular === true),
            isNew: !!(getVal(['nuevo'], '') === 'SI' || item.isnew || item.nuevo === true),
            link: sanitizeString(getVal(['link', 'enlace', 'url', 'descarga', 'archivo'], '#'))
          };
        });

        setTemplates(mapped);
      } catch (err) {
        console.error("Fetch Error:", err);
        setTemplates(FALLBACK_TEMPLATES as any);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const sectors = useMemo(() => Array.from(new Set(templates.map(t => t.sector).filter(Boolean))).sort(), [templates]);
  const categories = useMemo(() => Array.from(new Set(templates.map(t => t.category).filter(Boolean))).sort(), [templates]);
  const formats = useMemo(() => {
    const allFormats = templates.flatMap(t => t.fileType || []).filter(Boolean);
    return Array.from(new Set(allFormats.map(f => f.trim().toUpperCase()))).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = activeSector ? t.sector === activeSector : true;
      const matchesCategory = activeCategory ? t.category === activeCategory : true;
      const matchesFormat = activeFormat ? (t.fileType || []).some(f => f.trim().toUpperCase() === activeFormat) : true;
      return matchesSearch && matchesSector && matchesCategory && matchesFormat;
    });
    if (sortBy === 'popular') result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [templates, searchQuery, activeSector, activeCategory, activeFormat, sortBy]);

  const displayedTemplates = filteredTemplates.slice(0, visibleCount);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="size-16 border-4 border-pragmo-cyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-bold tracking-widest uppercase text-xs">Gestiosafe Cargando...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Banner de Descuento */}
      {DISCOUNT_PERCENT > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white py-2 lg:py-2.5 px-3 lg:px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMyIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative flex items-center justify-center gap-2 lg:gap-3">
            <span className="text-lg lg:text-2xl">🔥</span>
            <span className="font-black text-xs lg:text-base uppercase tracking-wide lg:tracking-wider">{PROMO_NAME}</span>
            <span className="bg-white text-red-600 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-sm font-black animate-pulse">
              -{DISCOUNT_PERCENT}%
            </span>
            <span className="text-[10px] lg:text-sm font-medium hidden sm:inline">{PROMO_MESSAGE}</span>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-bold shadow-2xl border border-white/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-pragmo-cyan">info</span>
            {toast}
          </div>
        </div>
      )}

      <nav className="h-16 lg:h-20 bg-background-dark/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-20 sticky top-0 z-[100]">
        <div className="flex items-center gap-2 lg:gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="size-8 lg:size-10 bg-pragmo-cyan rounded-lg lg:rounded-xl flex items-center justify-center text-background-dark shadow-lg">
            <span className="material-symbols-outlined font-bold text-lg lg:text-2xl">verified_user</span>
          </div>
          <h1 className="text-white text-base lg:text-xl font-extrabold tracking-tighter">Gestiosafe</h1>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <button onClick={() => scrollTo('catalog')} className="text-[11px] font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors">Plantillas</button>
          <button onClick={() => scrollTo('catalog')} className="text-[11px] font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors">Sectores</button>
        </div>

        <div className="flex items-center gap-1 lg:gap-4">
          {/* Botón Historial de Compras */}
          <button 
            onClick={() => setIsHistoryOpen(true)} 
            className="relative p-2 lg:p-2.5 text-slate-300 hover:bg-white/5 rounded-lg lg:rounded-xl transition-all"
            title="Mis Compras"
          >
            <span className="material-symbols-outlined text-xl lg:text-2xl">receipt_long</span>
          </button>
          {/* Botón Carrito */}
          <button onClick={() => itemCount > 0 && setIsCheckoutOpen(true)} className="relative p-2 lg:p-2.5 text-slate-300 hover:bg-white/5 rounded-lg lg:rounded-xl transition-all">
            <span className="material-symbols-outlined text-xl lg:text-2xl">shopping_cart</span>
            {itemCount > 0 && <span className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 size-4 lg:size-5 bg-pragmo-cyan text-background-dark text-[8px] lg:text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background-dark">{itemCount}</span>}
          </button>
          <button onClick={handleContactWhatsApp} className="px-5 py-2.5 bg-pragmo-blue hover:bg-blue-800 text-white text-[11px] font-bold rounded-xl shadow-lg transition-all hidden sm:block">CONTACTAR</button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-white bg-white/5 rounded-lg">
            <span className="material-symbols-outlined text-xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Filtros */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[99] bg-slate-900 pt-16 overflow-y-auto">
          {/* Header del menú */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Filtros</h3>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="p-4 space-y-5 pb-24">
            {/* Acciones rápidas */}
            <div className="space-y-2">
              <button onClick={() => { scrollTo('catalog'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3.5 text-white font-bold rounded-xl bg-slate-800 flex items-center gap-3 active:bg-slate-700">
                <span className="material-symbols-outlined text-pragmo-cyan">grid_view</span>
                Ver Plantillas
              </button>
              <button onClick={() => { handleContactWhatsApp(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3.5 text-white font-bold rounded-xl bg-slate-800 flex items-center gap-3 active:bg-slate-700">
                <span className="material-symbols-outlined text-green-400">chat</span>
                Contactar por WhatsApp
              </button>
            </div>
            
            {/* Filtro por Sector */}
            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-pragmo-cyan uppercase mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">business</span>
                  Sector
                </span>
                {activeSector && (
                  <button onClick={() => setActiveSector(null)} className="text-[10px] text-pragmo-cyan hover:text-cyan-300 font-bold">
                    Limpiar
                  </button>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {sectors.map(s => (
                  <button 
                    key={s} 
                    onClick={() => setActiveSector(activeSector === s ? null : s)} 
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                      activeSector === s 
                        ? 'bg-pragmo-cyan text-slate-900' 
                        : 'bg-slate-700 text-slate-300 active:bg-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {activeSector === s ? 'check_circle' : 'add_circle'}
                    </span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filtro por Categoría */}
            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-pragmo-green uppercase mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">category</span>
                  Categoría
                </span>
                {activeCategory && (
                  <button onClick={() => setActiveCategory(null)} className="text-[10px] text-pragmo-green hover:text-green-400 font-bold">
                    Limpiar
                  </button>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setActiveCategory(activeCategory === c ? null : c)} 
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                      activeCategory === c 
                        ? 'bg-pragmo-green text-white' 
                        : 'bg-slate-700 text-slate-300 active:bg-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {activeCategory === c ? 'check_circle' : 'add_circle'}
                    </span>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filtro por Formato */}
            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-orange-400 uppercase mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">description</span>
                  Tipo de Archivo
                </span>
                {activeFormat && (
                  <button onClick={() => setActiveFormat(null)} className="text-[10px] text-orange-400 hover:text-orange-300 font-bold">
                    Limpiar
                  </button>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {formats.map(f => (
                  <button 
                    key={f} 
                    onClick={() => setActiveFormat(activeFormat === f ? null : f)} 
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                      activeFormat === f 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-slate-700 text-slate-300 active:bg-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {activeFormat === f ? 'check_circle' : 'add_circle'}
                    </span>
                    <span className="material-symbols-outlined text-[14px]">
                      {f.includes('EXCEL') || f.includes('XLS') ? 'table_chart' : 
                       f.includes('WORD') || f.includes('DOC') ? 'article' : 
                       f.includes('PDF') ? 'picture_as_pdf' : 
                       f.includes('PPT') || f.includes('POWER') ? 'slideshow' : 'description'}
                    </span>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Botón aplicar filtros */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-4 bg-pragmo-blue text-white font-black rounded-xl active:bg-blue-700 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check</span>
              Aplicar Filtros
              {(activeSector || activeCategory || activeFormat) && (
                <span className="bg-white text-pragmo-blue text-xs px-2 py-0.5 rounded-full">
                  {(activeSector ? 1 : 0) + (activeCategory ? 1 : 0) + (activeFormat ? 1 : 0)}
                </span>
              )}
            </button>
            
            {/* Limpiar filtros */}
            {(activeSector || activeCategory || activeFormat) && (
              <button 
                onClick={() => { setActiveSector(null); setActiveCategory(null); setActiveFormat(null); }}
                className="w-full py-3 bg-slate-800 text-slate-400 font-bold rounded-xl active:bg-slate-700"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="bg-background-dark pt-6 lg:pt-24 pb-8 lg:pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-pragmo-cyan/10 to-transparent"></div>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-20 grid lg:grid-cols-2 gap-6 lg:gap-16 items-center relative z-10">
          <div className="space-y-3 lg:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 lg:px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="size-1.5 bg-pragmo-cyan rounded-full animate-pulse"></span>
              <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-widest text-slate-300">CATÁLOGO 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              <span className="lg:hidden">Plantillas SST<br/>Profesionales</span>
              <span className="hidden lg:inline">Digitaliza tu{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Seguridad Laboral</span>
                <br />con Plantillas Expertas
              </span>
            </h1>
            <p className="text-slate-400 text-xs lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Documentos listos para usar, diseñados por especialistas.
            </p>
            <div className="flex flex-row gap-2 lg:gap-3 justify-center lg:justify-start">
              <button onClick={() => scrollTo('catalog')} className="flex-1 sm:flex-none px-5 lg:px-10 py-3 lg:py-5 bg-pragmo-cyan hover:bg-cyan-500 active:bg-cyan-600 text-background-dark text-xs lg:text-base font-black rounded-xl lg:rounded-2xl shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 lg:gap-2">
                Ver Catálogo
                <span className="material-symbols-outlined text-base lg:text-2xl">arrow_forward</span>
              </button>
              <button onClick={handleContactWhatsApp} className="sm:hidden flex-1 px-5 py-3 bg-green-600 active:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-base">chat</span>
                WhatsApp
              </button>
            </div>
          </div>
          <div className="relative hidden lg:block" style={{ transform: 'scale(1.3)', transformOrigin: 'center center' }}>
            <div className="relative z-10 bg-slate-800 p-3 rounded-[2.5rem] shadow-2xl border-4 border-slate-700/50">
              <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-[16/11] relative">
                <img src={HERO_IMAGE_URL} className="w-full h-full object-cover" alt="Plantillas SST Profesionales" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="catalog" className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-12 p-3 lg:p-12 max-w-[1920px] mx-auto w-full relative">
        {/* Barra de búsqueda y filtros móviles - Sticky */}
        <div className="lg:hidden sticky top-16 z-50 bg-[#f8fafc] -mx-3 px-3 py-2 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pragmo-blue focus:border-pragmo-blue text-sm font-medium shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`px-3.5 py-2.5 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                activeSector || activeCategory || activeFormat
                  ? 'bg-pragmo-blue text-white' 
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              {(activeSector || activeCategory || activeFormat) && (
                <span className="ml-1 size-5 bg-white text-pragmo-blue text-[10px] font-bold rounded-full flex items-center justify-center">
                  {(activeSector ? 1 : 0) + (activeCategory ? 1 : 0) + (activeFormat ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
          {(activeSector || activeCategory || activeFormat) && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-400 font-medium">Filtros:</span>
              {activeSector && (
                <button 
                  onClick={() => setActiveSector(null)} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-pragmo-blue text-white text-[10px] font-bold rounded-full active:scale-95"
                >
                  {activeSector}
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
              {activeCategory && (
                <button 
                  onClick={() => setActiveCategory(null)} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-pragmo-green text-white text-[10px] font-bold rounded-full active:scale-95"
                >
                  {activeCategory}
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
              {activeFormat && (
                <button 
                  onClick={() => setActiveFormat(null)} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full active:scale-95"
                >
                  {activeFormat}
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
              <button 
                onClick={() => { setActiveSector(null); setActiveCategory(null); setActiveFormat(null); }}
                className="text-[10px] text-slate-500 underline ml-1"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
        
        <aside className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-28 space-y-6">
            <div className="bg-slate-200/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-300/30">
              <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-4">Buscar Solución</h4>
              <input
                type="text"
                placeholder="Ej: Matriz IPERC"
                className="w-full px-4 py-3.5 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-pragmo-blue text-sm font-medium text-slate-700 border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filtros laterales con lectura dinámica de categorías del Excel */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5 flex items-center justify-between">
                  <span>Sectores</span>
                  {activeSector && (
                    <button onClick={() => setActiveSector(null)} className="text-[9px] text-pragmo-blue hover:text-pragmo-cyan font-bold">
                      Limpiar
                    </button>
                  )}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sectors.map(s => (
                    <button
                      key={s}
                      onClick={() => setActiveSector(activeSector === s ? null : s)}
                      className={`group flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                        activeSector === s 
                          ? 'bg-pragmo-cyan text-slate-900 shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {activeSector === s ? 'check_circle' : 'add_circle'}
                      </span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5 flex items-center justify-between">
                  <span>Categorías</span>
                  {activeCategory && (
                    <button onClick={() => setActiveCategory(null)} className="text-[9px] text-pragmo-green hover:text-green-600 font-bold">
                      Limpiar
                    </button>
                  )}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(activeCategory === c ? null : c)}
                      className={`group flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                        activeCategory === c 
                          ? 'bg-pragmo-green text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {activeCategory === c ? 'check_circle' : 'add_circle'}
                      </span>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5 flex items-center justify-between">
                  <span>Tipo de Archivo</span>
                  {activeFormat && (
                    <button onClick={() => setActiveFormat(null)} className="text-[9px] text-orange-500 hover:text-orange-600 font-bold">
                      Limpiar
                    </button>
                  )}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formats.map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFormat(activeFormat === f ? null : f)}
                      className={`group flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                        activeFormat === f 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {activeFormat === f ? 'check_circle' : 'add_circle'}
                      </span>
                      <span className="material-symbols-outlined text-[14px]">
                        {f.includes('EXCEL') || f.includes('XLS') ? 'table_chart' : 
                         f.includes('WORD') || f.includes('DOC') ? 'article' : 
                         f.includes('PDF') ? 'picture_as_pdf' : 
                         f.includes('PPT') || f.includes('POWER') ? 'slideshow' : 'description'}
                      </span>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-3 lg:space-y-8">
          <div className="bg-white p-2.5 lg:p-6 lg:px-10 rounded-xl lg:rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
            <p className="text-[10px] lg:text-sm font-bold text-slate-400">
              <span className="hidden sm:inline">Resultados: </span>
              <span className="text-slate-900 font-black">{filteredTemplates.length}</span>
              <span className="sm:hidden text-slate-400"> items</span>
            </p>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)} 
              className="bg-slate-50 border border-slate-200 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-bold py-1.5 lg:py-2.5 px-2 pr-6 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
            >
              <option value="popular">Popular</option>
              <option value="price-low">Menor $</option>
              <option value="price-high">Mayor $</option>
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-8">
            {displayedTemplates.map(t => (
              <TemplateCard key={t.id} template={t} onSelect={setSelectedTemplate} />
            ))}
            {displayedTemplates.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">search_off</span>
                <p className="text-slate-400 font-bold">No se encontraron resultados para tu búsqueda.</p>
              </div>
            )}
          </div>
        </main>
      </section>

      {/* Botones Flotantes Móviles */}
      <div className="lg:hidden fixed bottom-6 right-4 z-[90] flex flex-col gap-3">
        {/* Botón Historial - solo si hay compras previas */}
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="size-12 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center transition-all active:scale-90"
          title="Historial de Compras"
        >
          <span className="material-symbols-outlined text-xl">receipt_long</span>
        </button>
        
        {/* Botón Carrito */}
        <button 
          onClick={() => itemCount > 0 && setIsCheckoutOpen(true)}
          className={`size-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90 relative ${
            itemCount > 0 
              ? 'bg-pragmo-cyan text-slate-900 shadow-cyan-500/40' 
              : 'bg-slate-200 text-slate-400'
          }`}
          disabled={itemCount === 0}
        >
          <span className="material-symbols-outlined text-2xl">shopping_cart</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 size-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Footer Principal */}
      <footer className="bg-[#0f2942] text-white pt-16 pb-8 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
          {/* Grid Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
            
            {/* Logo y Descripción */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-pragmo-cyan/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-pragmo-cyan text-xl">verified_user</span>
                </div>
                <span className="text-2xl font-black tracking-tight">GESTIOSAFE</span>
              </div>
              <p className="text-slate-400 text-sm">Plantillas Premium de Seguridad Laboral</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                © 2026 GESTIOSAFE. Todos los derechos reservados.
              </p>
            </div>

            {/* Productos */}
            <div className="space-y-4">
              <h4 className="text-white font-bold uppercase tracking-wider text-sm">Productos</h4>
              <ul className="space-y-3">
                <li><button onClick={() => { setActiveSector(null); setActiveCategory(null); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Todas las Plantillas</button></li>
                <li><button onClick={() => { setActiveCategory('Seguridad'); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Plantillas de Seguridad</button></li>
                <li><button onClick={() => { setActiveCategory('Legal'); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Documentos Legales</button></li>
                <li><button onClick={() => { setActiveCategory('RRHH'); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Formatos RRHH</button></li>
              </ul>
            </div>

            {/* Sectores */}
            <div className="space-y-4">
              <h4 className="text-white font-bold uppercase tracking-wider text-sm">Sectores</h4>
              <ul className="space-y-3">
                <li><button onClick={() => { setActiveSector('Construccion'); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Construcción</button></li>
                <li><button onClick={() => { setActiveSector('Mineria'); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Minería</button></li>
                <li><button onClick={() => { setActiveSector('Manufactura'); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Manufactura</button></li>
                <li><button onClick={() => { setActiveSector('Transporte'); scrollTo('catalog'); }} className="text-slate-400 hover:text-pragmo-cyan transition-colors text-sm">Transporte</button></li>
              </ul>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h4 className="text-white font-bold uppercase tracking-wider text-sm">Contacto</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-red-400 text-base">location_on</span>
                  Lima, Perú
                </li>
                <li className="flex items-center gap-2 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-slate-500 text-base">mail</span>
                  app@loganqehs.com
                </li>
                <a href="https://api.whatsapp.com/send/?phone=51983113140&text=Quiero+informaci%C3%B3n+sobre+Gestiosafe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-green-400 text-sm transition-colors">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  (+51) 983 113 140
                </a>
              </ul>
              {/* Redes Sociales */}
              <div className="flex items-center gap-3 pt-2">
                <a href="https://www.linkedin.com/company/loganqehs" target="_blank" rel="noopener noreferrer" className="size-9 bg-slate-700/50 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.facebook.com/loganqehs" target="_blank" rel="noopener noreferrer" className="size-9 bg-slate-700/50 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/loganqehs" target="_blank" rel="noopener noreferrer" className="size-9 bg-slate-700/50 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-500 hover:to-purple-600 rounded-full flex items-center justify-center transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Línea divisora - Marcas */}
          <div className="border-t border-slate-700/50 pt-8">
            {/* Versión Desktop */}
            <div className="hidden lg:flex items-center justify-center gap-8">
              <span className="text-slate-400 text-sm font-medium">GESTIOSAFE es un producto de</span>
              <a href="https://www.pragmo.pe" target="_blank" rel="noopener noreferrer" className="bg-white px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg">
                <img src="https://www.pragmo.pe/imagenes/logan-qehs-consultores-s-a-c-logo-15102025175641.png" alt="PRAGMO" className="h-10 object-contain" />
              </a>
              <span className="text-slate-500 text-lg">|</span>
              <span className="text-slate-400 text-sm font-medium">PRAGMO es una marca de</span>
              <a href="https://www.loganqehs.com" target="_blank" rel="noopener noreferrer" className="bg-white px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg">
                <img src="https://www.loganqehs.com/imagenes/logan-qehs-logo-05102023094955.png" alt="LOGAN QEHS" className="h-10 object-contain" />
              </a>
            </div>
            
            {/* Versión Mobile - Diseño claro y visible */}
            <div className="lg:hidden space-y-5">
              {/* Título principal */}
              <p className="text-white text-sm font-semibold text-center tracking-wide">GESTIOSAFE es un producto de</p>
              
              {/* Logos en línea con fondo destacado */}
              <div className="flex items-center justify-center gap-4">
                <a href="https://www.pragmo.pe" target="_blank" rel="noopener noreferrer" className="bg-white px-5 py-3 rounded-2xl shadow-xl active:scale-95 transition-transform">
                  <img src="https://www.pragmo.pe/imagenes/logan-qehs-consultores-s-a-c-logo-15102025175641.png" alt="PRAGMO" className="h-9 object-contain" />
                </a>
                
                <div className="flex items-center gap-1 bg-slate-700/60 px-3 py-1.5 rounded-full">
                  <span className="text-white text-xs font-bold">by</span>
                  <span className="material-symbols-outlined text-pragmo-green text-base">arrow_forward</span>
                </div>
                
                <a href="https://www.loganqehs.com" target="_blank" rel="noopener noreferrer" className="bg-white px-5 py-3 rounded-2xl shadow-xl active:scale-95 transition-transform">
                  <img src="https://www.loganqehs.com/imagenes/logan-qehs-logo-05102023094955.png" alt="LOGAN QEHS" className="h-9 object-contain" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <TemplateDetailsDrawer template={selectedTemplate} onClose={() => setSelectedTemplate(null)} onAddToCart={addToCart} />
      
      {/* Modal de Historial de Compras */}
      <PurchaseHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      
      {/* Modal de retorno de Mercado Pago */}
      {showPaymentCallback && (
        <PaymentCallback 
          onClose={() => setShowPaymentCallback(false)} 
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

const App = () => (
  <CartProvider>
    <PurchaseHistoryProvider>
      <AppContent />
    </PurchaseHistoryProvider>
  </CartProvider>
);
export default App;
