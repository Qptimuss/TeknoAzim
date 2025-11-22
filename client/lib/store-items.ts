import { Gem, Star, Zap, Shield } from 'lucide-react';

export const RARITIES = {
  SIRADAN: { name: 'Sıradan', color: 'text-gray-400', chance: '49%' },
  SIRADISI: { name: 'Sıradışı', color: 'text-blue-400', chance: '30%' },
  ENDER: { name: 'Ender', color: 'text-purple-500', chance: '15%' },
  EFSANEVI: { name: 'Efsanevi', color: 'text-yellow-400', chance: '5%' },
  ÖZEL: { name: 'Özel', color: 'text-fuchsia-400', chance: '1%' },
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

  // Efsanevi
  { name: 'Alevli Çember', rarity: RARITIES.EFSANEVI.name, className: 'border-4 border-transparent rounded-full bg-clip-border bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 animate-spin [animation-duration:3s]' },

  // Özel
  { name: 'Nova', rarity: RARITIES.ÖZEL.name, className: 'p-1 bg-gradient-to-tr from-purple-500 via-indigo-700 to-fuchsia-500 rounded-full shadow-[0_0_20px_theme(colors.purple.400)] animate-pulse' },
];