
// Use string literals for categories as Category enum was removed from types.ts
import { Template, FileType } from './types';

export const TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Matriz de Riesgos IPERC',
    description: 'Identificación de Peligros y Evaluación de Riesgos con fórmulas automáticas y gráficos de calor.',
    price: 29.99,
    category: 'Construcción',
    // Added sector property to satisfy Template interface
    sector: 'Minería & Construcción',
    fileType: [FileType.EXCEL],
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426',
    isPopular: true
  },
  {
    id: '2',
    name: 'Plan de Emergencia 2024',
    description: 'Protocolos completos de evacuación, sismos e incendios. Incluye organigrama de brigadas.',
    price: 45.00,
    category: 'Construcción',
    // Added sector property to satisfy Template interface
    sector: 'Edificaciones',
    fileType: [FileType.WORD, FileType.PDF],
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1590486803833-ffc6f08d380f?auto=format&fit=crop&q=80&w=1587',
    isNew: true
  },
  {
    id: '3',
    name: 'Inspección de Extintores',
    description: 'Checklist mensual para inspección de equipos contra incendios. Formato digital e imprimible.',
    price: 15.00,
    category: 'Manufactura',
    // Added sector property to satisfy Template interface
    sector: 'Industrial',
    fileType: [FileType.PDF],
    rating: 5.0,
    imageUrl: 'https://images.unsplash.com/photo-1599708153386-62dfdec69af4?auto=format&fit=crop&q=80&w=1635'
  },
  {
    id: '4',
    name: 'Plan Estratégico Vial (PESV)',
    description: 'Estructura completa para implementar el PESV cumpliendo normativas ISO 39001.',
    price: 55.00,
    category: 'Logística',
    // Added sector property to satisfy Template interface
    sector: 'Transporte',
    fileType: [FileType.PDF, FileType.WORD],
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1470',
    isPopular: true
  },
  {
    id: '5',
    name: 'Programa de Gestión de EPP',
    description: 'Formatos de entrega, reposición y matriz de selección de Equipos de Protección Personal.',
    price: 25.00,
    category: 'Manufactura',
    // Added sector property to satisfy Template interface
    sector: 'Salud Ocupacional',
    fileType: [FileType.EXCEL, FileType.WORD],
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&q=80&w=1470'
  },
  {
    id: '6',
    name: 'Reglamento Interno de SST',
    description: 'Modelo base del Reglamento Interno de Seguridad y Salud en el Trabajo conforme a ley.',
    price: 60.00,
    category: 'Legal',
    // Added sector property to satisfy Template interface
    sector: 'Recursos Humanos',
    fileType: [FileType.WORD],
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1470'
  }
];
