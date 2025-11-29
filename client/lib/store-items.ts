import { Gem, Star, Zap, Shield } from 'lucide-react';

export const RARITIES = {
  SIRADAN: { name: 'Sıradan', color: 'text-gray-400', chance: '57.8%' }, // %0.3 artırıldı
  SIRADISI: { name: 'Sıradışı', color: 'text-blue-400', chance: '30%' },
  ENDER: { name: 'Ender', color: 'text-purple-500', chance: '10%' },
  EFSANEVI: { name: 'Efsanevi', color: 'text-yellow-400', chance: '2%' },
  ÖZEL: { name: 'Özel', color: 'text-fuchsia-400', chance: '0.2%' }, // %0.2 olarak güncellendi
};

export const FRAMES = [
  // Sıradan
  { name: 'Klasik Bronz', rarity: RARITIES.SIRADAN.name, className: 'border-4 border-[#CD7F32] rounded-full' },
  { name: 'Basit Gümüş', rarity: RARITIES.SIRADAN.name, className: 'border-4 border-gray-400 rounded-full' },
  { name: 'Sade Çelik', rarity: RARITIES.SIRADAN.name, className: 'border-4 border-gray-500 rounded-full' },
  { name: 'Ahşap Çerçeve', rarity: RARITIES.SIRADAN.name, className: 'border-8 border-yellow-800 rounded-full' },
  { name: 'Minimalist', rarity: RARITIES.SIRADAN.name, className: 'border-2 border-white rounded-full' },

  // Sıradışı
  { name: 'Çift Halkalı Altın', rarity: RARITIES.SIRADISI.name, className: 'border-4 border-yellow-500 rounded-full p-1 bg-background border-double' },
  { name: 'Neon Mavi', rarity: RARITIES.SIRADISI.name, className: 'border-2 border-blue-500 rounded-full shadow-[0_0_10px_theme(colors.blue.500)]' },
  { name: 'Tekno Çizgiler', rarity: RARITIES.SIRADISI.name, className: 'border-4 border-dashed border-cyan-400 rounded-full' },

  // Ender
  { name: 'Kraliyet Moru', rarity: RARITIES.ENDER.name, className: 'border-4 border-purple-600 rounded-full p-1 bg-gradient-to-br from-purple-400 to-purple-800' },
  { name: 'Galaktik Halka', rarity: RARITIES.ENDER.name, className: 'border-2 border-indigo-500 rounded-full shadow-[0_0_15px_theme(colors.indigo.400)] animate-pulse' },
  { name: 'Kristal Kenar', rarity: RARITIES.ENDER.name, className: 'border-4 border-sky-300 rounded-full p-1 bg-gradient-to-br from-blue-200 to-cyan-400 shadow-[0_0_10px_theme(colors.sky.300)]' },

  // Efsanevi
  { 
    name: 'Alevli Çember', 
    rarity: RARITIES.EFSANEVI.name, 
    className: 'p-2 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 animate-fire-spin animate-fire-glow [animation-duration:3s] [animation-timing-function:linear] [animation-iteration-count:infinite]' 
  },
  { 
    name: 'Kozmik Aura', 
    rarity: RARITIES.EFSANEVI.name, 
    className: 'border-4 border-fuchsia-500 rounded-full p-1 bg-gradient-to-br from-indigo-700 to-purple-900 shadow-[0_0_20px_theme(colors.fuchsia.400)] animate-pulse' 
  },

  // Özel
  { name: 'Nova', rarity: RARITIES.ÖZEL.name, className: '' },
];