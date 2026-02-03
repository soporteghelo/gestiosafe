
import React, { useState, useMemo, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Template } from './types';
import { TEMPLATES as FALLBACK_TEMPLATES } from './constants';
import TemplateCard from './components/TemplateCard';
import CheckoutModal from './components/CheckoutModal';
import PaymentCallback from './components/PaymentCallback';
import { APPS_SCRIPT_URL, WHATSAPP_NUMBER } from './config';
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
    if (template) setIsOpen(true);
    else setIsOpen(false);
  }, [template]);

  if (!template) return null;
  const alreadyInCart = cart.some(item => item.id === template.id);

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => { setIsOpen(false); setTimeout(onClose, 300); }}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[120] shadow-2xl transition-transform duration-500 ease-out transform flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-pragmo-blue">description</span>
            <h2 className="font-extrabold text-slate-800 uppercase tracking-tighter">Detalles del Recurso</h2>
          </div>
          <button onClick={() => { setIsOpen(false); setTimeout(onClose, 300); }} className="size-10 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="aspect-video rounded-3xl overflow-hidden shadow-lg bg-slate-100">
            <img src={template.imageUrl} className="w-full h-full object-cover" alt={template.name} />
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="bg-pragmo-green/10 text-pragmo-green text-[10px] font-bold px-3 py-1 rounded-lg uppercase">{template.sector}</span>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-lg uppercase">{template.category}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight">{template.name}</h1>
            <p className="text-slate-500 text-sm leading-relaxed">{template.description}</p>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inversión única</span>
            <p className="text-2xl lg:text-3xl font-black text-slate-900">${template.price.toFixed(2)}</p>
          </div>
          <button
            disabled={alreadyInCart}
            onClick={() => { onAddToCart(template); setIsOpen(false); setTimeout(onClose, 300); }}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg ${alreadyInCart ? 'bg-slate-100 text-slate-400' : 'bg-pragmo-blue hover:bg-blue-800 text-white active:scale-95'}`}
          >
            {alreadyInCart ? 'Agregado' : 'Añadir al Carrito'}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

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

  const filteredTemplates = useMemo(() => {
    let result = templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = activeSector ? t.sector === activeSector : true;
      const matchesCategory = activeCategory ? t.category === activeCategory : true;
      return matchesSearch && matchesSector && matchesCategory;
    });
    if (sortBy === 'popular') result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [templates, searchQuery, activeSector, activeCategory, sortBy]);

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
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-bold shadow-2xl border border-white/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-pragmo-cyan">info</span>
            {toast}
          </div>
        </div>
      )}

      <nav className="h-20 bg-background-dark/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 lg:px-20 sticky top-0 z-[100]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="size-9 lg:size-10 bg-pragmo-cyan rounded-xl flex items-center justify-center text-background-dark shadow-lg">
            <span className="material-symbols-outlined font-bold">verified_user</span>
          </div>
          <h1 className="text-white text-lg lg:text-xl font-extrabold tracking-tighter">Gestiosafe</h1>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <button onClick={() => scrollTo('catalog')} className="text-[11px] font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors">Plantillas</button>
          <button onClick={() => scrollTo('catalog')} className="text-[11px] font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors">Sectores</button>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button onClick={() => itemCount > 0 && setIsCheckoutOpen(true)} className="relative p-2.5 text-slate-300 hover:bg-white/5 rounded-xl transition-all">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            {itemCount > 0 && <span className="absolute top-1 right-1 size-5 bg-pragmo-cyan text-background-dark text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background-dark">{itemCount}</span>}
          </button>
          <button onClick={handleContactWhatsApp} className="px-5 py-2.5 bg-pragmo-blue hover:bg-blue-800 text-white text-[11px] font-bold rounded-xl shadow-lg transition-all hidden sm:block">CONTACTAR</button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-white bg-white/5 rounded-xl">
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-background-dark pt-12 lg:pt-24 pb-20 lg:pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-pragmo-cyan/10 to-transparent"></div>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
              <span className="size-2 bg-pragmo-cyan rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">NUEVO CATÁLOGO 2024</span>
            </div>
            <h1 className="text-4xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              Digitaliza tu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Seguridad Laboral</span> <br className="hidden lg:block" />
              con Plantillas Expertas
            </h1>
            <p className="text-slate-400 text-base lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Optimiza tus auditorías y asegura el cumplimiento normativo con documentos listos para usar, diseñados por especialistas en prevención.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={() => scrollTo('catalog')} className="px-8 lg:px-10 py-4 lg:py-5 bg-pragmo-cyan hover:bg-cyan-500 text-background-dark font-black rounded-2xl shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-3">
                Ver Catálogo
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button onClick={() => showToast("Video demo próximamente")} className="px-8 lg:px-10 py-4 lg:py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3">
                <span className="material-symbols-outlined">play_circle</span>
                Demo Video
              </button>
            </div>
          </div>
          <div className="relative hidden sm:block">
            <div className="relative z-10 bg-slate-800 p-3 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border-4 border-slate-700/50">
              <div className="bg-slate-900 rounded-[1.8rem] lg:rounded-[2rem] overflow-hidden aspect-[16/11] relative">
                <img src="https://images.unsplash.com/photo-1557426282-2d8d5942da5b?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="catalog" className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 lg:p-12 max-w-[1920px] mx-auto w-full relative">
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
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5">Sectores</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveSector(null)}
                    className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${!activeSector ? 'bg-pragmo-blue text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Todos los Sectores
                  </button>
                  {sectors.map(s => (
                    <button
                      key={s}
                      onClick={() => setActiveSector(s)}
                      className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeSector === s ? 'bg-pragmo-blue text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5">Categorías</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${!activeCategory ? 'bg-pragmo-green text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Todas las Categorías
                  </button>
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeCategory === c ? 'bg-pragmo-green text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <div className="bg-white p-5 lg:p-6 lg:px-10 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
            <p className="text-xs lg:text-sm font-bold text-slate-400">Resultados: <span className="text-slate-900 font-black">{filteredTemplates.length}</span></p>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-bold py-2.5">
              <option value="popular">Más Populares</option>
              <option value="price-low">Menor Inversión</option>
              <option value="price-high">Mayor Inversión</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
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

      <footer className="bg-background-dark text-white py-12 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-20 text-center">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2024 Gestiosafe Inc. • Soluciones Digitales SST
          </p>
        </div>
      </footer>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <TemplateDetailsDrawer template={selectedTemplate} onClose={() => setSelectedTemplate(null)} onAddToCart={addToCart} />
      
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

const App = () => (<CartProvider><AppContent /></CartProvider>);
export default App;
