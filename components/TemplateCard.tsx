
import React from 'react';
import { Template } from '../types';
import { useCart } from '../context/CartContext';

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const { addToCart, cart } = useCart();
  const alreadyInCart = cart.some(item => item.id === template.id);

  return (
    <div className="bg-white rounded-xl lg:rounded-[2rem] overflow-hidden shadow-sm lg:shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group lg:hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] lg:hover:-translate-y-2 transition-all duration-500 h-full active:scale-[0.98] lg:active:scale-100">
      {/* Área de Imagen */}
      <div className="relative aspect-[4/3] lg:aspect-[16/10] overflow-hidden cursor-pointer bg-slate-100" onClick={() => onSelect(template)}>
        <img 
          src={template.imageUrl} 
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        {/* Overlay con botón - solo desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex items-center justify-center">
          <span className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full border border-white/30 transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
            <span className="material-symbols-outlined text-3xl">visibility</span>
          </span>
        </div>
        
        {/* Badge Popular */}
        {template.isPopular && (
          <div className="absolute top-1.5 right-1.5 lg:top-4 lg:right-4">
            <span className="bg-pragmo-green text-white text-[7px] lg:text-[9px] font-black px-1.5 py-0.5 lg:px-2.5 lg:py-1.5 rounded lg:rounded-lg uppercase tracking-wide shadow-lg flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px] lg:text-xs">star</span>
              <span className="hidden sm:inline">Popular</span>
            </span>
          </div>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="p-2.5 lg:p-6 flex flex-col flex-1">
        {/* Etiquetas: Sector, Categoría y Tipo de Archivo */}
        <div className="mb-1.5 lg:mb-3 flex flex-wrap gap-1 lg:gap-1.5">
          {/* Sector */}
          <span className="bg-pragmo-blue/10 text-pragmo-blue font-bold text-[7px] lg:text-[9px] uppercase tracking-wider px-1.5 lg:px-2 py-0.5 rounded flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px] lg:text-xs hidden sm:inline">business</span>
            {template.sector}
          </span>
          {/* Categoría */}
          <span className="bg-pragmo-green/10 text-pragmo-green font-bold text-[7px] lg:text-[9px] uppercase tracking-wider px-1.5 lg:px-2 py-0.5 rounded flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px] lg:text-xs hidden sm:inline">category</span>
            {template.category}
          </span>
          {/* Tipo de Archivo */}
          {template.fileType && template.fileType.length > 0 && (
            <span className="bg-orange-100 text-orange-600 font-bold text-[7px] lg:text-[9px] uppercase tracking-wider px-1.5 lg:px-2 py-0.5 rounded flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px] lg:text-xs hidden sm:inline">description</span>
              {Array.isArray(template.fileType) ? template.fileType.join(', ') : template.fileType}
            </span>
          )}
        </div>
        
        {/* Título */}
        <h3 
          className="text-slate-800 text-[11px] lg:text-base font-bold lg:font-extrabold leading-tight mb-1 lg:mb-3 line-clamp-2 group-hover:text-pragmo-blue transition-colors cursor-pointer min-h-[2.5em] lg:min-h-0"
          onClick={() => onSelect(template)}
        >
          {template.name}
        </h3>
        
        {/* Descripción - solo desktop */}
        <p className="hidden lg:block text-slate-500 text-xs line-clamp-2 mb-6 leading-relaxed font-medium">
          {template.description}
        </p>

        {/* Footer de la Tarjeta */}
        <div className="mt-auto pt-2 lg:pt-4 border-t border-slate-50 flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <span className="hidden lg:block text-[9px] font-bold text-slate-300 uppercase mb-0.5">Inversión</span>
            <p className="text-slate-900 text-sm lg:text-lg font-black">${template.price.toFixed(2)}</p>
          </div>
          <div className="flex gap-1 lg:gap-2 shrink-0">
            {/* Botón info - oculto en móvil muy pequeño */}
            <button 
              onClick={() => onSelect(template)}
              className="hidden sm:flex size-8 lg:size-10 items-center justify-center rounded-lg lg:rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-pragmo-blue transition-all active:scale-90"
              title="Ver Detalles"
            >
              <span className="material-symbols-outlined text-base lg:text-xl">info</span>
            </button>
            {/* Botón agregar al carrito */}
            <button 
              disabled={alreadyInCart}
              onClick={(e) => {
                e.stopPropagation();
                if (!alreadyInCart) addToCart(template);
              }}
              className={`size-9 lg:size-10 flex items-center justify-center rounded-lg lg:rounded-xl transition-all active:scale-90 ${
                alreadyInCart 
                ? 'bg-green-100 text-green-500' 
                : 'bg-pragmo-blue hover:bg-blue-800 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-lg lg:text-xl">
                {alreadyInCart ? 'check' : 'add_shopping_cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
