export interface IconItem {
  key: string;
  nameEn: string;
  nameAr: string;
  category: 'tech' | 'abstract' | 'badges' | 'business' | 'creative' | 'nature' | 'monogram' | 'arabesque' | 'gaming';
  viewBox?: string;
  path: string; // SVG path or SVG inner elements
}

export const ICON_CATEGORIES = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'tech', labelAr: 'تقنية وذكاء اصطناعي', labelEn: 'Tech & AI' },
  { id: 'abstract', labelAr: 'أشكال هندسية وتجريدية', labelEn: 'Abstract & Geometric' },
  { id: 'badges', labelAr: 'شارات ودروع وملكية', labelEn: 'Badges & Seals' },
  { id: 'business', labelAr: 'أعمال وتجارة', labelEn: 'Business & Brand' },
  { id: 'creative', labelAr: 'إبداع وفنون', labelEn: 'Creative & Art' },
  { id: 'nature', labelAr: 'طبيعة وبيئة', labelEn: 'Nature & Eco' },
  { id: 'gaming', labelAr: 'ألعاب ورياضات إلكترونية', labelEn: 'Gaming & Esports' },
  { id: 'arabesque', labelAr: 'زخارف إسلامية وعربية', labelEn: 'Arabesque & Islamic' },
  { id: 'monogram', labelAr: 'حروف وأحرف أولى', labelEn: 'Monograms' },
];

export const ICON_LIBRARY: IconItem[] = [
  // --- TECH & AI ---
  {
    key: 'cpu',
    nameEn: 'Microchip AI',
    nameAr: 'معالج ذكي',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  },
  {
    key: 'zap',
    nameEn: 'Energy Bolt',
    nameAr: 'صاعقة طاقة',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
  },
  {
    key: 'sparkles',
    nameEn: 'AI Sparkles',
    nameAr: 'بريق الذكاء',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" fill="currentColor"/><path d="M19 2l1 2.5L22.5 5.5l-2.5 1L19 9l-1-2.5L15.5 5.5l2.5-1L19 2z" fill="currentColor"/><path d="M5 16l1 2.5L8.5 19.5l-2.5 1L5 23l-1-2.5L1.5 19.5l2.5-1L5 16z" fill="currentColor"/>'
  },
  {
    key: 'atom',
    nameEn: 'Quantum Atom',
    nameAr: 'ذرة كمية',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="2.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(90 12 12)" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(150 12 12)" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    key: 'code-brackets',
    nameEn: 'Code Brackets',
    nameAr: 'أقواس برمجة',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<polyline points="16 18 22 12 16 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="8 6 2 12 8 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="14" y1="4" x2="10" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  },
  {
    key: 'rocket',
    nameEn: 'Speed Rocket',
    nameAr: 'صاروخ انطلاق',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/><path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2 5-2M15 18v5s3.03-.55 4.5-2c1.63-1.62 2-5 2-5" fill="none" stroke="currentColor" stroke-width="2"/>'
  },
  {
    key: 'cloud-data',
    nameEn: 'Cloud Core',
    nameAr: 'سحابة ذكية',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="2" fill="currentColor"/>'
  },
  {
    key: 'cyber-cube',
    nameEn: 'Cyber Cube',
    nameAr: 'مكعب سايبر',
    category: 'tech',
    viewBox: '0 0 24 24',
    path: '<path d="M21 16.5V7.5L12 2.25L3 7.5V16.5L12 21.75L21 16.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 2.25V21.75M3 7.5L21 16.5M3 16.5L21 7.5" stroke="currentColor" stroke-width="1.8"/>'
  },

  // --- ABSTRACT & GEOMETRIC ---
  {
    key: 'infinity-loop',
    nameEn: 'Infinity Orbit',
    nameAr: 'مدار اللانهاية',
    category: 'abstract',
    viewBox: '0 0 24 24',
    path: '<path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.26-8-12.356-8-5.096 0-5.096 8 0 8 5.096 0 7.261-8 12.356-8Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    key: 'triangle-prism',
    nameEn: 'Prism Delta',
    nameAr: 'منشور مثلثي',
    category: 'abstract',
    viewBox: '0 0 24 24',
    path: '<polygon points="12 2 22 20 2 20 12 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><polygon points="12 7 18 18 6 18 12 7" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.5"/>'
  },
  {
    key: 'geometric-rings',
    nameEn: 'Triple Orbit',
    nameAr: 'حلقات متداخلة',
    category: 'abstract',
    viewBox: '0 0 24 24',
    path: '<circle cx="8" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/>'
  },
  {
    key: 'spiral-vortex',
    nameEn: 'Vortex Sun',
    nameAr: 'دوامة إشعاعية',
    category: 'abstract',
    viewBox: '0 0 24 24',
    path: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6Zm0-8a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z" fill="currentColor"/>'
  },
  {
    key: 'hexagon-node',
    nameEn: 'Hex Node',
    nameAr: 'خلية سداسية',
    category: 'abstract',
    viewBox: '0 0 24 24',
    path: '<polygon points="12 2 20.66 7 20.66 17 12 22 3.34 17 3.34 7 12 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>'
  },
  {
    key: 'origami-bird',
    nameEn: 'Origami Bird',
    nameAr: 'طائر أوريغامي',
    category: 'abstract',
    viewBox: '0 0 24 24',
    path: '<polygon points="2 12 9 4 15 8 22 2 17 15 12 13 8 20 2 12" fill="currentColor" fill-opacity="0.8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
  },
  {
    key: 'wave-sine',
    nameEn: 'Modern Wave',
    nameAr: 'موجة حديثة',
    category: 'abstract',
    viewBox: '0 0 24 24',
    path: '<path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 5-4 7.5 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M2 17c2.5-4 5-4 7.5 0s5 4 7.5 0 5-4 7.5 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>'
  },

  // --- BADGES & SEALS & LUXURY ---
  {
    key: 'crown-royal',
    nameEn: 'Royal Crown',
    nameAr: 'تاج ملكي',
    category: 'badges',
    viewBox: '0 0 24 24',
    path: '<path d="M2 4l3 12h14l3-12-5 6-5-8-5 8-5-6z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><rect x="3" y="18" width="18" height="3" rx="1.5" fill="currentColor"/>'
  },
  {
    key: 'shield-crest',
    nameEn: 'Knight Shield',
    nameAr: 'درع الفارس',
    category: 'badges',
    viewBox: '0 0 24 24',
    path: '<path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6v13c2.7-1.1 5.3-4.8 5.3-8V7.5L12 6z" fill="currentColor" fill-opacity="0.3"/>'
  },
  {
    key: 'diamond-gem',
    nameEn: 'Precious Gem',
    nameAr: 'ألماسة فاخرة',
    category: 'badges',
    viewBox: '0 0 24 24',
    path: '<polygon points="6 3 18 3 22 9 12 21 2 9 6 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><polygon points="6 3 12 9 18 3" fill="currentColor" fill-opacity="0.2"/><polyline points="2 9 12 9 22 9" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="9" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/>'
  },
  {
    key: 'laurel-wreath',
    nameEn: 'Laurel Victory',
    nameAr: 'إكليل الغار',
    category: 'badges',
    viewBox: '0 0 24 24',
    path: '<path d="M6 8a4 4 0 0 1 3 3M4 14a4 4 0 0 1 4 2M3 11a4 4 0 0 1 4 1M8 3a4 4 0 0 1 1 4M18 8a4 4 0 0 0-3 3M20 14a4 4 0 0 0-4 2M21 11a4 4 0 0 0-4 1M16 3a4 4 0 0 0-1 4M7 21c2.5 0 5-1 5-3M17 21c-2.5 0-5-1-5-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/>'
  },
  {
    key: 'stamp-seal',
    nameEn: 'Vintage Stamp',
    nameAr: 'ختم معتمد',
    category: 'badges',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 2"/><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="12 7.5 13.5 10.5 16.5 11 14.5 13 15 16 12 14.5 9 16 9.5 13 7.5 11 10.5 10.5 12 7.5" fill="currentColor"/>'
  },

  // --- BUSINESS & BRAND ---
  {
    key: 'globe-network',
    nameEn: 'Global Network',
    nameAr: 'شبكة عالمية',
    category: 'business',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.8"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    key: 'target-bullseye',
    nameEn: 'Precision Target',
    nameAr: 'هدف دقيق',
    category: 'business',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>'
  },
  {
    key: 'shopping-bag',
    nameEn: 'Modern Bag',
    nameAr: 'حقيبة تسوق',
    category: 'business',
    viewBox: '0 0 24 24',
    path: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  },
  {
    key: 'compass-arrow',
    nameEn: 'Navigation Compass',
    nameAr: 'بوصلة توجيه',
    category: 'business',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor"/>'
  },
  {
    key: 'bar-growth',
    nameEn: 'Growth Trend',
    nameAr: 'مؤشر نمو',
    category: 'business',
    viewBox: '0 0 24 24',
    path: '<line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><polyline points="3 10 9 5 13 8 21 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },

  // --- CREATIVE & ART ---
  {
    key: 'palette-art',
    nameEn: 'Color Palette',
    nameAr: 'لوحة ألوان',
    category: 'creative',
    viewBox: '0 0 24 24',
    path: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6.5" cy="11.5" r="1.5" fill="currentColor"/><circle cx="9.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="11.5" r="1.5" fill="currentColor"/>'
  },
  {
    key: 'feather-pen',
    nameEn: 'Quill Feather',
    nameAr: 'ريشة أدبية',
    category: 'creative',
    viewBox: '0 0 24 24',
    path: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L3 11.5V21h9.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="16" y1="8" x2="2" y2="22" stroke="currentColor" stroke-width="2"/>'
  },
  {
    key: 'lens-aperture',
    nameEn: 'Camera Iris',
    nameAr: 'عدسة تصوير',
    category: 'creative',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="14.31" y1="8" x2="20.05" y2="17.94" stroke="currentColor" stroke-width="1.8"/><line x1="9.69" y1="8" x2="21.17" y2="8" stroke="currentColor" stroke-width="1.8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06" stroke="currentColor" stroke-width="1.8"/><line x1="9.69" y1="16" x2="3.95" y2="6.06" stroke="currentColor" stroke-width="1.8"/><line x1="14.31" y1="16" x2="2.83" y2="16" stroke="currentColor" stroke-width="1.8"/><line x1="16.62" y1="12" x2="10.88" y2="21.94" stroke="currentColor" stroke-width="1.8"/>'
  },

  // --- NATURE & ECO ---
  {
    key: 'leaf-eco',
    nameEn: 'Pure Leaf',
    nameAr: 'ورقة خضراء',
    category: 'nature',
    viewBox: '0 0 24 24',
    path: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  },
  {
    key: 'water-drop',
    nameEn: 'Aqua Drop',
    nameAr: 'قطرة نقية',
    category: 'nature',
    viewBox: '0 0 24 24',
    path: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="10" cy="14" r="2" fill="white" fill-opacity="0.6"/>'
  },
  {
    key: 'mountain-peak',
    nameEn: 'Mountain Peaks',
    nameAr: 'قمم الجبال',
    category: 'nature',
    viewBox: '0 0 24 24',
    path: '<polygon points="8 3 15 15 1 15 8 3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><polygon points="16 8 23 19 9 19 16 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  },
  {
    key: 'flame-fire',
    nameEn: 'Dynamic Fire',
    nameAr: 'شعلة متوهجة',
    category: 'nature',
    viewBox: '0 0 24 24',
    path: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
  },

  // --- GAMING & ESPORTS ---
  {
    key: 'gamepad-console',
    nameEn: 'Esports Controller',
    nameAr: 'ذراع تحكم',
    category: 'gaming',
    viewBox: '0 0 24 24',
    path: '<rect x="2" y="6" width="20" height="12" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="10" x2="8" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="13" r="1" fill="currentColor"/><circle cx="18" cy="11" r="1" fill="currentColor"/>'
  },
  {
    key: 'spartan-helmet',
    nameEn: 'Warrior Helmet',
    nameAr: 'خوذة المحارب',
    category: 'gaming',
    viewBox: '0 0 24 24',
    path: '<path d="M12 2a9 9 0 0 0-9 9c0 4.14 2.8 7.6 6.6 8.6L10 16h4l.4 3.6c3.8-1 6.6-4.46 6.6-8.6a9 9 0 0 0-9-9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 11h4M12 2v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  },

  // --- ARABESQUE & ISLAMIC ---
  {
    key: 'arabesque-star',
    nameEn: 'Eight Point Star',
    nameAr: 'نجمة ثمانية إسلامية',
    category: 'arabesque',
    viewBox: '0 0 24 24',
    path: '<rect x="4.5" y="4.5" width="15" height="15" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4.5" y="4.5" width="15" height="15" rx="1" transform="rotate(45 12 12)" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'
  },
  {
    key: 'crescent-moon',
    nameEn: 'Crescent & Star',
    nameAr: 'هلال ونجمة',
    category: 'arabesque',
    viewBox: '0 0 24 24',
    path: '<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" fill="currentColor"/><polygon points="18 4 19 7 22 7 19.5 9 20.5 12 18 10 15.5 12 16.5 9 14 7 17 7 18 4" fill="currentColor"/>'
  },
  {
    key: 'dome-arch',
    nameEn: 'Oriental Arch',
    nameAr: 'قوس ومحراب شرقي',
    category: 'arabesque',
    viewBox: '0 0 24 24',
    path: '<path d="M4 21V11C4 7 12 2 12 2s8 5 8 9v10H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 21v-7c0-2 4-4 4-4s4 2 4 4v7H8z" fill="currentColor" fill-opacity="0.3"/>'
  },

  // --- MONOGRAM / LETTER STYLES ---
  {
    key: 'letter-a',
    nameEn: 'Modern Letter A',
    nameAr: 'حرف A عصري',
    category: 'monogram',
    viewBox: '0 0 24 24',
    path: '<path d="M12 3L3 21h4.5l2-4.5h5l2 4.5H21L12 3zm-1.2 10.5L12 7.8l1.2 5.7h-2.4z" fill="currentColor"/>'
  },
  {
    key: 'letter-m',
    nameEn: 'Modern Letter M',
    nameAr: 'حرف M ديناميكي',
    category: 'monogram',
    viewBox: '0 0 24 24',
    path: '<path d="M3 4v16h3.5v-9.5L12 17l5.5-6.5V20H21V4h-4l-5 6.5L7 4H3z" fill="currentColor"/>'
  },
  {
    key: 'letter-n',
    nameEn: 'Modern Letter N',
    nameAr: 'حرف N أنيق',
    category: 'monogram',
    viewBox: '0 0 24 24',
    path: '<path d="M4 4v16h4V9.5L16 20h4V4h-4v10.5L8 4H4z" fill="currentColor"/>'
  },
  {
    key: 'letter-s',
    nameEn: 'Modern Letter S',
    nameAr: 'حرف S انسيابي',
    category: 'monogram',
    viewBox: '0 0 24 24',
    path: '<path d="M18 7c0-2-2-4-6-4S6 5 6 8c0 5 12 3 12 8 0 3-2.5 5-6 5s-6-2-6-5h3.5c0 1.5 1.5 2.5 2.5 2.5s2.5-.8 2.5-2.2c0-4.8-12-3.3-12-8.3C2.5 4.8 5.8 2 12 2s9.5 2.5 9.5 5H18z" fill="currentColor"/>'
  },
  {
    key: 'arabic-dal',
    nameEn: 'Arabic Monogram Alif-Lam',
    nameAr: 'طغراء حرف عربي',
    category: 'monogram',
    viewBox: '0 0 24 24',
    path: '<path d="M19 4v16h-3V7.5c-2.5 0-5 2-5 5.5v7H8V4h3v6c1-2.5 3.5-4 6-4h2z" fill="currentColor"/>'
  }
];
