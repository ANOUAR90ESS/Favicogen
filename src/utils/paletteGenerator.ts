/**
 * Smart Color Palette Generator Utility
 * Computes harmonious color schemes (Complementary, Analogous, Triadic, 
 * Split-Complementary, Tetradic, Monochromatic, Warm/Cool) based on a base hex color.
 */

export interface ColorHarmony {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  colors: string[];
  suggestedUsage: {
    bg1: string;
    bg2: string;
    icon1: string;
    icon2: string;
    text: string;
    accent: string;
  };
}

// Convert Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 67, g: 56, b: 202 }; // fallback indigo
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hexR = clamp(r).toString(16).padStart(2, '0');
  const hexG = clamp(g).toString(16).padStart(2, '0');
  const hexB = clamp(b).toString(16).padStart(2, '0');
  return `#${hexR}${hexG}${hexB}`;
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hNorm = ((h % 360) + 360) % 360 / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = hue2rgb(p, q, hNorm + 1 / 3);
  const g = hue2rgb(p, q, hNorm);
  const b = hue2rgb(p, q, hNorm - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Helper to convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Compute Relative Luminance (WCAG)
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    const norm = v / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Compute Contrast Ratio
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Generate Smart Color Harmonies based on base hex color
 */
export function generateHarmonies(baseHex: string): ColorHarmony[] {
  const { r, g, b } = hexToRgb(baseHex);
  const { h, s, l } = rgbToHsl(r, g, b);

  // 1. Complementary Harmony (opposite side of color wheel: h + 180)
  const compHue = (h + 180) % 360;
  const compColor = hslToHex(compHue, s, l);
  const compLight = hslToHex(compHue, Math.max(30, s - 10), Math.min(92, l + 25));
  const baseDark = hslToHex(h, Math.min(100, s + 15), Math.max(12, l - 30));
  const baseLight = hslToHex(h, Math.max(20, s - 15), Math.min(92, l + 30));

  const complementary: ColorHarmony = {
    id: 'complementary',
    nameEn: 'Complementary (High Contrast)',
    nameAr: 'الألوان المكملة (تباين فائق)',
    descriptionEn: 'Opposite on the color wheel for bold, vibrant visual punch.',
    descriptionAr: 'لونان متقابلان على عجلة الألوان يمنحان تبايناً حيوياً وجذاباً.',
    colors: [baseDark, baseHex, compColor, compLight, baseLight],
    suggestedUsage: {
      bg1: baseDark,
      bg2: hslToHex(h, s, Math.max(8, l - 40)),
      icon1: compColor,
      icon2: compLight,
      text: '#ffffff',
      accent: compColor,
    },
  };

  // 2. Analogous Harmony (adjacent colors: h - 30, h + 30)
  const anaHue1 = (h + 330) % 360;
  const anaHue2 = (h + 30) % 360;
  const anaColor1 = hslToHex(anaHue1, s, l);
  const anaColor2 = hslToHex(anaHue2, s, l);
  const anaLight = hslToHex(anaHue2, Math.max(40, s - 10), Math.min(88, l + 25));

  const analogous: ColorHarmony = {
    id: 'analogous',
    nameEn: 'Analogous (Smooth Harmony)',
    nameAr: 'الألوان المتجاورة (تناغم متصل)',
    descriptionEn: 'Colors that sit next to each other, creating serene unity.',
    descriptionAr: 'ألوان متقاربة في عجلة الألوان تعطي انسيابية وتدرجاً طبيعياً راقياً.',
    colors: [baseDark, anaColor1, baseHex, anaColor2, anaLight],
    suggestedUsage: {
      bg1: baseDark,
      bg2: hslToHex(anaHue1, s, Math.max(10, l - 35)),
      icon1: anaColor2,
      icon2: anaLight,
      text: '#ffffff',
      accent: anaColor2,
    },
  };

  // 3. Triadic Harmony (equilateral triangle: h + 120, h + 240)
  const triHue1 = (h + 120) % 360;
  const triHue2 = (h + 240) % 360;
  const triColor1 = hslToHex(triHue1, s, l);
  const triColor2 = hslToHex(triHue2, s, l);
  const triLight = hslToHex(triHue1, Math.max(40, s - 10), Math.min(85, l + 20));

  const triadic: ColorHarmony = {
    id: 'triadic',
    nameEn: 'Triadic (Balanced Trio)',
    nameAr: 'التناغم الثلاثي (توازن حيوي)',
    descriptionEn: 'Three colors evenly spaced on the color wheel for dynamic balance.',
    descriptionAr: 'ثلاثة ألوان متباعدة بانتظام توفر توازناً غنياً ومتناسقاً للشعار.',
    colors: [baseDark, baseHex, triColor1, triColor2, triLight],
    suggestedUsage: {
      bg1: baseDark,
      bg2: hslToHex(h, s, Math.max(10, l - 38)),
      icon1: triColor1,
      icon2: triColor2,
      text: '#ffffff',
      accent: triColor1,
    },
  };

  // 4. Split-Complementary (h + 150, h + 210)
  const splitHue1 = (h + 150) % 360;
  const splitHue2 = (h + 210) % 360;
  const splitColor1 = hslToHex(splitHue1, s, l);
  const splitColor2 = hslToHex(splitHue2, s, l);

  const splitComp: ColorHarmony = {
    id: 'split-complementary',
    nameEn: 'Split Complementary',
    nameAr: 'المكمل المنشطر (تناغم راقٍ)',
    descriptionEn: 'High contrast with less tension than a pure complementary scheme.',
    descriptionAr: 'تباين مريح للعين مع ثراء بصري أكبر من التناغم المكمل المباشر.',
    colors: [baseDark, baseHex, splitColor1, splitColor2, baseLight],
    suggestedUsage: {
      bg1: baseDark,
      bg2: hslToHex(h, s, Math.max(10, l - 36)),
      icon1: splitColor1,
      icon2: splitColor2,
      text: '#ffffff',
      accent: splitColor1,
    },
  };

  // 5. Monochromatic (Same Hue, varying Lightness/Saturation)
  const mono1 = hslToHex(h, Math.min(100, s + 10), 12);
  const mono2 = hslToHex(h, Math.min(100, s + 5), 28);
  const mono3 = baseHex;
  const mono4 = hslToHex(h, Math.max(20, s - 10), 68);
  const mono5 = hslToHex(h, Math.max(10, s - 25), 90);

  const monochromatic: ColorHarmony = {
    id: 'monochromatic',
    nameEn: 'Monochromatic (Clean & Modern)',
    nameAr: 'الأحادي النقي (عصري وبسيط)',
    descriptionEn: 'Single hue across rich shades and tints for a sleek, unified look.',
    descriptionAr: 'درجات وظلال لنفس اللون تمنح الشعار طابعاً مينيمالي وسلساً.',
    colors: [mono1, mono2, mono3, mono4, mono5],
    suggestedUsage: {
      bg1: mono1,
      bg2: mono2,
      icon1: mono4,
      icon2: mono5,
      text: '#ffffff',
      accent: mono4,
    },
  };

  // 6. Luxury Arabic & Gold / Bronze Accents (Infused with Base)
  const goldHue = 42; // Amber Gold
  const goldColor1 = hslToHex(goldHue, 90, 52);
  const goldColor2 = hslToHex(goldHue, 85, 38);
  const deepObsidian = hslToHex(h, Math.min(40, s), 8);

  const luxuryGold: ColorHarmony = {
    id: 'luxury-gold',
    nameEn: 'Royal Gold Accent',
    nameAr: 'الفخامة الملكية والذهب',
    descriptionEn: 'Infuses deep rich tones with bright gold and metallic accents.',
    descriptionAr: 'دمج الدرجات الداكنة مع بريق الذهب الملكي لإطلالة فاخرة.',
    colors: [deepObsidian, baseDark, baseHex, goldColor1, goldColor2],
    suggestedUsage: {
      bg1: deepObsidian,
      bg2: hslToHex(h, Math.min(50, s), 14),
      icon1: goldColor1,
      icon2: goldColor2,
      text: '#fef08a',
      accent: goldColor1,
    },
  };

  // 7. Cyberpunk / Neon Glow
  const neonHue = (h + 90) % 360;
  const neon1 = hslToHex(h, 100, 55);
  const neon2 = hslToHex(neonHue, 100, 55);
  const darkCyber = hslToHex(h, 60, 8);

  const cyberpunk: ColorHarmony = {
    id: 'cyberpunk',
    nameEn: 'Cyber Neon Tech',
    nameAr: 'النيون السيبراني والتقنية',
    descriptionEn: 'Ultra-vibrant, saturated electric highlights for gaming & AI brands.',
    descriptionAr: 'ألوان مشبعة بتوهج نيون مستقبلي تناسب مشاريع التقنية والذكاء والـ Gaming.',
    colors: [darkCyber, baseHex, neon1, neon2, '#ffffff'],
    suggestedUsage: {
      bg1: darkCyber,
      bg2: hslToHex(neonHue, 70, 10),
      icon1: neon1,
      icon2: neon2,
      text: '#ffffff',
      accent: neon1,
    },
  };

  return [complementary, analogous, triadic, splitComp, monochromatic, luxuryGold, cyberpunk];
}

export interface ComplementaryColorOption {
  id: string;
  hex: string;
  nameEn: string;
  nameAr: string;
  harmonyTypeEn: string;
  harmonyTypeAr: string;
  descriptionEn: string;
  descriptionAr: string;
  contrastRatio: number;
}

/**
 * Generate 4 Complementary / Harmonious Color suggestions from a Primary Hex
 */
export function generate4ComplementaryColors(
  baseHex: string,
  variationSeed: number = 0
): ComplementaryColorOption[] {
  const { r, g, b } = hexToRgb(baseHex);
  const { h, s, l } = rgbToHsl(r, g, b);

  // Normalize seed offset so clicking "Generate Palette" cycles/explores fresh stylish palettes
  const mode = Math.abs(variationSeed) % 4;

  const sat1 = Math.max(50, Math.min(100, s + (mode === 1 ? 15 : mode === 2 ? -10 : mode === 3 ? 20 : 0)));
  const light1 = Math.max(35, Math.min(75, l > 60 ? l - 25 : l < 35 ? l + 35 : 52));

  // 1. Direct Complementary (180° opposite)
  const compHue = (h + 180) % 360;
  const compHex = hslToHex(compHue, sat1, light1);

  // 2. Split-Complementary Warm (150° offset)
  const splitWarmHue = (h + 150 + (mode * 5)) % 360;
  const splitWarmHex = hslToHex(splitWarmHue, Math.min(95, sat1 + 5), Math.max(38, Math.min(72, light1 + 5)));

  // 3. Split-Complementary Cool (210° offset)
  const splitCoolHue = (h + 210 - (mode * 5)) % 360;
  const splitCoolHex = hslToHex(splitCoolHue, Math.min(95, sat1 + 5), Math.max(38, Math.min(72, light1 - 4)));

  // 4. Vibrant Triadic Accent (120° offset or luminous tint)
  const triadicHue = (h + 120 + (mode * 25)) % 360;
  const triadicHex = hslToHex(triadicHue, Math.min(100, sat1 + 10), Math.max(42, Math.min(80, light1 + 8)));

  const list: ComplementaryColorOption[] = [
    {
      id: 'direct-complementary',
      hex: compHex,
      nameEn: 'Direct Complementary',
      nameAr: 'مكمل مباشر',
      harmonyTypeEn: '180° Opposite',
      harmonyTypeAr: 'متقابل 180°',
      descriptionEn: 'Bold high-contrast punch for secondary gradient & dual-tone icon.',
      descriptionAr: 'تباين فائق وجريء للتدرجات والأيقونات ثنائية الألوان.',
      contrastRatio: Number(getContrastRatio(baseHex, compHex).toFixed(2)),
    },
    {
      id: 'split-warm',
      hex: splitWarmHex,
      nameEn: 'Split Complement (Warm)',
      nameAr: 'مكمل منشطر (دافئ)',
      harmonyTypeEn: '150° Warm Offset',
      harmonyTypeAr: 'انزياح دافئ 150°',
      descriptionEn: 'Warm counterpart with smooth visual energy and elegance.',
      descriptionAr: 'تناغم دافئ أنيق يمنح الشعار حيوية وجاذبية.',
      contrastRatio: Number(getContrastRatio(baseHex, splitWarmHex).toFixed(2)),
    },
    {
      id: 'split-cool',
      hex: splitCoolHex,
      nameEn: 'Split Complement (Cool)',
      nameAr: 'مكمل منشطر (بارد)',
      harmonyTypeEn: '210° Cool Offset',
      harmonyTypeAr: 'انزياح بارد 210°',
      descriptionEn: 'Clean, modern tech contrast with balanced saturation.',
      descriptionAr: 'تباين عصري وتقني نظيف ومتوازن.',
      contrastRatio: Number(getContrastRatio(baseHex, splitCoolHex).toFixed(2)),
    },
    {
      id: 'triadic-accent',
      hex: triadicHex,
      nameEn: 'Vibrant Accent Glow',
      nameAr: 'توهج إشعاعي مكمل',
      harmonyTypeEn: 'Harmonic Triad',
      harmonyTypeAr: 'تناغم إشعاعي مكمل',
      descriptionEn: 'Dynamic luminous accent for secondary borders, rings, and text.',
      descriptionAr: 'لمسة إشعاعية جذابة للإطارات والحلقات والنصوص الثانوية.',
      contrastRatio: Number(getContrastRatio(baseHex, triadicHex).toFixed(2)),
    },
  ];

  return list;
}
