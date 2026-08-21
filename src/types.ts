export type ShapeMask = 
  | 'square' 
  | 'squircle' 
  | 'circle' 
  | 'shield' 
  | 'hexagon' 
  | 'octagon' 
  | 'diamond' 
  | 'badge' 
  | 'pill';

export type BackgroundType = 'transparent' | 'solid' | 'linear' | 'radial' | 'mesh';

export type PatternType = 'none' | 'dots' | 'grid' | 'stripes' | 'waves' | 'circuit';

export type TextCurve = 'straight' | 'arch-up' | 'arch-down' | 'circle' | 'wave';

export type LayoutStyle = 'icon-top' | 'icon-left' | 'icon-only' | 'text-only' | 'badge-center' | 'monogram';

export interface ImageFilters {
  brightness: number; // 0 to 200 (100 is default)
  contrast: number; // 0 to 200 (100 is default)
  saturation: number; // 0 to 200 (100 is default)
  hueRotate: number; // 0 to 360 deg
  grayscale: number; // 0 to 100%
  invert: number; // 0 to 100%
  sepia: number; // 0 to 100%
  blur: number; // 0 to 20px
}

export interface LogoConfig {
  id: string;
  name: string;
  updatedAt: number;
  
  // Canvas settings
  canvasSize: number; // default 512
  padding: number; // 0 - 100
  
  // Background
  bgType: BackgroundType;
  bgColor1: string;
  bgColor2: string;
  bgGradientAngle: number; // 0 - 360
  pattern: PatternType;
  patternOpacity: number; // 0 - 1
  shapeMask: ShapeMask;
  borderRadius: number; // for rounded square 0 - 256
  
  // Border & Effects
  borderWidth: number;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'double';
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetY: number;
  innerGlow: boolean;
  innerGlowColor: string;
  
  // Icon / Graphic Element
  iconType: 'library' | 'custom-svg' | 'emoji' | 'image' | 'none';
  iconKey: string; // key from iconLibrary
  customSvgString?: string;
  emojiChar?: string;
  iconSize: number; // 30 - 450
  iconColor: string;
  iconColor2?: string; // for dual-tone icons
  iconGradient: boolean;
  iconGradientAngle: number;
  iconOffsetX: number; // -200 to 200
  iconOffsetY: number; // -200 to 200
  iconRotation: number; // 0 - 360
  iconFlipH: boolean;
  iconFlipV: boolean;
  iconOpacity: number; // 0 - 1
  iconShadow: boolean;
  iconShadowColor: string;
  iconShadowBlur: number;
  iconShadowOffsetX: number;
  iconShadowOffsetY: number;
  iconOutline: boolean;
  iconOutlineWidth: number;
  iconOutlineColor: string;
  
  // Uploaded Raster Image & Editor Settings
  uploadedImageSrc?: string;
  uploadedImageScale: number; // 20 to 300%
  uploadedImageOffsetX: number;
  uploadedImageOffsetY: number;
  uploadedImageRotation: number;
  uploadedImageOpacity: number; // 0 to 1
  uploadedImageCropShape: 'none' | 'circle' | 'squircle' | 'square' | 'hexagon';
  uploadedImageFilters: ImageFilters;
  
  // Primary Text (Brand Name)
  showText: boolean;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  textColor: string;
  textColor2?: string;
  textGradient: boolean;
  textGradientAngle: number;
  letterSpacing: number; // -5 to 30
  textLineHeight: number; // 0.8 to 2.0
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textOffsetX: number;
  textOffsetY: number;
  textRotation: number;
  textCurve: TextCurve;
  textCurveRadius: number; // 50 to 300
  textShadow: boolean;
  textShadowColor: string;
  textShadowBlur: number;
  textShadowOffsetX: number;
  textShadowOffsetY: number;
  textStroke: boolean;
  textStrokeWidth: number;
  textStrokeColor: string;
  textUppercase: boolean;
  
  // Secondary Text (Tagline / Slogan)
  showTagline: boolean;
  tagline: string;
  taglineFontFamily: string;
  taglineFontSize: number;
  taglineFontWeight: number | string;
  taglineColor: string;
  taglineLetterSpacing: number;
  taglineOffsetY: number;
  taglineUppercase: boolean;
  
  // Decorative Accents
  showRing: boolean;
  ringRadius: number;
  ringWidth: number;
  ringColor: string;
  ringDash: boolean;
  
  showBadgeRibbon: boolean;
  badgeRibbonText?: string;
  badgeRibbonColor?: string;
  
  // Layout Preset
  layout: LayoutStyle;
}

export interface FaviconSpec {
  size: number;
  fileName: string;
  format: 'png' | 'ico' | 'svg' | 'webp' | 'jpeg';
  label: string;
  description: string;
  isFaviconStandard?: boolean;
  isAppleTouch?: boolean;
  isAndroidChrome?: boolean;
  isPWA?: boolean;
}

export interface Template {
  id: string;
  nameEn: string;
  nameAr: string;
  category: 'tech' | 'corporate' | 'abstract' | 'minimal' | 'luxury' | 'ecommerce' | 'creative' | 'eco' | 'gaming' | 'badges' | 'arabesque';
  categoryLabelAr: string;
  categoryLabelEn: string;
  config: Partial<LogoConfig>;
}

export interface SavedColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface AIIdeaSuggestion {
  name: string;
  tagline: string;
  iconCategory: string;
  suggestedIcon: string;
  bgType: BackgroundType;
  bgColor1: string;
  bgColor2: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  shapeMask: ShapeMask;
  layout?: LayoutStyle;
  description: string;
}

export interface FeatureGraphicOptions {
  layout: 'center-hero' | 'split-phone' | 'mesh-gradient' | 'minimal-luxury' | 'arabesque' | 'store-spotlight';
  title: string;
  subtitle: string;
  badgeText: string;
  bgTheme: 'brand' | 'sunset' | 'cyber' | 'emerald' | 'gold' | 'dark' | 'light';
  showPhoneMockup: boolean;
  showPlayBadge: boolean;
  showRatingStars: boolean;
  showGlowEffect: boolean;
  customBgColor1?: string;
  customBgColor2?: string;
}

export type ResizeCategory =
  | 'custom'
  | 'google-play'
  | 'app-store'
  | 'web-favicon'
  | 'social-media'
  | 'print-paper';

export interface ResizePreset {
  id: string;
  category: ResizeCategory;
  nameAr: string;
  nameEn: string;
  width: number;
  height: number;
  aspectRatio: string;
  defaultFormat: 'png' | 'jpeg' | 'webp' | 'ico';
  descriptionAr: string;
  descriptionEn: string;
  badge?: string;
}

export interface UniversalResizeOptions {
  width: number;
  height: number;
  unit: 'px' | 'cm' | 'mm' | 'in';
  dpi: number;
  maintainAspectRatio: boolean;
  fitMode: 'contain' | 'cover' | 'stretch' | 'pad';
  backgroundStyle: 'transparent' | 'solid' | 'blur-fill' | 'gradient';
  backgroundColor: string;
  backgroundColor2?: string;
  cropShape: 'square' | 'rounded' | 'circle' | 'squircle' | 'none';
  borderRadius: number;
  format: 'png' | 'jpeg' | 'webp' | 'ico';
  quality: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  blur: number;
}

export type SocialRatioType = '1:1' | '16:9' | '3:1' | '4:1' | '9:16';

export interface SocialMediaPreset {
  id: string;
  platform: 'youtube' | 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'discord' | 'general';
  ratio: SocialRatioType;
  type: 'profile' | 'banner' | 'post' | 'story';
  nameAr: string;
  nameEn: string;
  width: number;
  height: number;
  cropStyle: 'circle' | 'square' | 'rounded';
  descriptionAr: string;
  descriptionEn: string;
  safeZoneGuide?: string;
}

export interface SocialBannerOptions {
  layout: 'center-hero' | 'split-hero' | 'minimal-clean' | 'mesh-gradient' | 'brand-luxury' | 'badge-callout';
  title?: string;
  subtitle?: string;
  bgTheme: 'brand' | 'dark' | 'light' | 'sunset' | 'emerald' | 'cyberpunk' | 'transparent';
  customBgColor1?: string;
  customBgColor2?: string;
  showBadge?: boolean;
  badgeText?: string;
  showGlowEffect?: boolean;
  showSafeZone?: boolean;
}

export type SupportedLanguage = 'ar' | 'en';

