
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
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] lg:hover:-translate-y-2 transition-all duration-500 h-full active:scale-[0.98] lg:active:scale-100">
      {/* Área de Imagen con Hover Effect */}
      <div className="relative aspect-[16/10] overflow-hidden cursor-pointer bg-slate-100" onClick={() => onSelect(template)}>
        <img 
          src={template.imageUrl} 
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full border border-white/30 transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                <span className="material-symbols-outlined text-2xl lg:text-3xl">visibility</span>
            </span>
        </div>
        
        {template.isPopular && (
          <div className="absolute top-4 right-4">
            <span className="bg-pragmo-green text-white text-[8px] lg:text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-lg">Popular</span>
          </div>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="p-5 lg:p-6 flex flex-col flex-1">
        <div className="flex flex-wrap gap-2 mb-3 lg:mb-4">
          <span className="bg-pragmo-blue/10 text-pragmo-blue font-bold text-[8px] lg:text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-pragmo-blue/10">
            {template.sector}
          </span>
          <span className="bg-slate-100 text-slate-500 font-bold text-[8px] lg:text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-slate-200">
            {template.category}
          </span>
        </div>
        
        <h3 
          className="text-slate-800 text-sm lg:text-base font-extrabold leading-tight mb-3 line-clamp-2 group-hover:text-pragmo-blue transition-colors cursor-pointer"
          onClick={() => onSelect(template)}
        >
          {template.name}
        </h3>
        
        <p className="text-slate-500 text-[11px] lg:text-xs line-clamp-2 mb-6 leading-relaxed font-medium">
          {template.description}
        </p>

        {/* Footer de la Tarjeta */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-300 uppercase block mb-0.5">Inversión</span>
            <p className="text-slate-900 text-base lg:text-lg font-black">${template.price.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onSelect(template)}
              className="size-9 lg:size-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-pragmo-blue transition-all"
              title="Ver Detalles"
            >
                <span className="material-symbols-outlined text-lg lg:text-xl">info</span>
            </button>
            <button 
              disabled={alreadyInCart}
              onClick={() => !alreadyInCart && addToCart(template)}
              className={`size-9 lg:size-10 flex items-center justify-center rounded-xl transition-all ${
                alreadyInCart 
                ? 'bg-slate-100 text-slate-300' 
                : 'bg-pragmo-blue hover:bg-blue-800 text-white shadow-lg shadow-blue-500/10'
              }`}
            >
              <span className="material-symbols-outlined text-lg lg:text-xl">
                {alreadyInCart ? 'check' : 'shopping_cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
