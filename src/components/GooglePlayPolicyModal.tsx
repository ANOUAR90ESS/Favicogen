import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Copy,
  Download,
  Smartphone,
  ExternalLink,
  Lock,
  Award,
  Check,
  FolderArchive,
  BookOpen,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { PRIVACY_POLICY_MD, PRIVACY_POLICY_AR } from '../Legal/privacyPolicy';
import { TERMS_OF_SERVICE_MD, TERMS_OF_SERVICE_AR } from '../Legal/termsOfService';

interface GooglePlayPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
}

export const GooglePlayPolicyModal: React.FC<GooglePlayPolicyModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = language === 'ar' || i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'google-play-checklist' | 'data-safety' | 'legal-docs'>('privacy');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activePrivacyText = isAr ? PRIVACY_POLICY_AR : PRIVACY_POLICY_MD;
  const activeTermsText = isAr ? TERMS_OF_SERVICE_AR : TERMS_OF_SERVICE_MD;

  return (
    <div
      id="google-play-policy-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                {isAr ? 'سياسة الخصوصية وتوافق متجر Google Play' : 'Privacy Policy & Google Play Compliance'}
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isAr ? 'معتمد للنشر' : 'Production Ready'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'سياسة الخصوصية الرسمية وشروط الاستخدام وتجهيز متطلبات إطلاق التطبيق'
                  : 'Official Privacy Policy, Commercial Terms, and Google Play Store submission checklist'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 overflow-x-auto shrink-0">
          {[
            { id: 'privacy', nameAr: '🔒 سياسة الخصوصية', nameEn: '🔒 Privacy Policy', icon: Lock },
            { id: 'terms', nameAr: '📜 شروط الاستخدام والملكية', nameEn: '📜 Terms of Service', icon: FileText },
            { id: 'legal-docs', nameAr: '📁 ملفات Legal ومستندات Markdown', nameEn: '📁 Legal Markdown Docs', icon: FolderArchive },
            { id: 'google-play-checklist', nameAr: '📱 متطلبات Google Play', nameEn: '📱 Play Store Checklist', icon: Smartphone },
            { id: 'data-safety', nameAr: '🛡️ أمان البيانات (Data Safety)', nameEn: '🛡️ Data Safety Form', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{isAr ? tab.nameAr : tab.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed custom-scrollbar">
          {/* 1. PRIVACY POLICY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-xs">
                    {isAr
                      ? 'وثيقة سياسة خصوصية معتمدة للنسخ ووضع رابطها في Google Play Console'
                      : 'Production-ready Privacy Policy text for your Google Play Console store listing'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile('PRIVACY_POLICY.md', activePrivacyText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>{isAr ? 'تنزيل .MD' : 'Download .MD'}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(activePrivacyText, 'privacy-text')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedSection === 'privacy-text' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{isAr ? 'نسخ السياسة' : 'Copy Policy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Formatted Policy Document */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 font-sans text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {isAr
                      ? 'سياسة الخصوصية الرسمية لتطبيق Logo & Favicon Studio'
                      : 'Official Privacy Policy for Logo & Favicon Studio'}
                  </h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">/Legal/PRIVACY_POLICY.md</span>
                </div>

                <div className="space-y-3 leading-relaxed">
                  <p>
                    <strong>{isAr ? 'آخر تحديث:' : 'Last Updated:'}</strong> 24 August 2026
                  </p>
                  <p>
                    {isAr
                      ? 'نحن نلتزم بحماية خصوصية المستخدمين. هذا التطبيق يعمل بنظام المعالجة المحلية (Client-Side First)، بحيث تظل كافة الصور والتصميمات والأيقونات مخزنة حصرياً على جهازك الشخصي ولا يتم رفعها أو تخزينها على خوادمنا.'
                      : 'We are committed to protecting your privacy. This application operates on a Client-Side First architecture, ensuring that all your images, graphics, and logo designs remain exclusively on your device.'}
                  </p>

                  <h4 className="font-bold text-slate-900 pt-2">
                    {isAr ? '1. البيانات التي نجمعها:' : '1. Data Collection & Processing:'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>
                      {isAr
                        ? 'لا نجمع أي معلومات شخصية، أو أرقام هواتف، أو بيانات مالية.'
                        : 'No personal identification, phone numbers, or financial information is harvested.'}
                    </li>
                    <li>
                      {isAr
                        ? 'الملفات والصور المصدرة تحفظ مباشرة في جهاز المستخدم.'
                        : 'Exported graphic assets are saved directly to your local file system.'}
                    </li>
                  </ul>

                  <h4 className="font-bold text-slate-900 pt-2">
                    {isAr ? '2. الأذونات المطلوبة في التطبيق:' : '2. Device Permissions:'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>
                      <strong>{isAr ? 'التخزين والملفات:' : 'Storage / File Access:'}</strong>{' '}
                      {isAr
                        ? 'لقراءة الصور المراد تعديلها وحفظ الشعار المصدر (PNG, SVG, ICO, JPG, WebP).'
                        : 'Used strictly to allow you to pick custom logos and download generated design packages.'}
                    </li>
                    <li>
                      <strong>{isAr ? 'الإنترنت (Network):' : 'Internet / Network:'}</strong>{' '}
                      {isAr
                        ? 'لتحميل الخطوط وميزة التوليد بالذكاء الاصطناعي الاختيارية فقط.'
                        : 'Used solely for Google web fonts and optional Gemini AI logo generation requests.'}
                    </li>
                  </ul>

                  <h4 className="font-bold text-slate-900 pt-2">
                    {isAr ? '3. التواصل والدعم الفني:' : '3. Developer Contact:'}
                  </h4>
                  <p className="text-slate-600">
                    {isAr ? 'البريد الإلكتروني المعتمد للدعم:' : 'Official Developer Contact Email:'}{' '}
                    <code className="bg-slate-200 text-indigo-700 px-2 py-0.5 rounded-md font-mono font-bold">
                      anwarasbas2018@gmail.com
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. TERMS OF SERVICE TAB */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-xs">
                    {isAr
                      ? 'حقوق الاستخدام التجاري والتسجيل كعلامة تجارية بنسبة 100%'
                      : '100% Full Commercial Ownership & Trademark Rights for all your created designs'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile('TERMS_OF_SERVICE.md', activeTermsText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>{isAr ? 'تنزيل .MD' : 'Download .MD'}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(activeTermsText, 'terms-text')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedSection === 'terms-text' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{isAr ? 'نسخ الشروط' : 'Copy Terms'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 font-sans text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {isAr ? 'شروط الاستخدام والملكية التجارية' : 'Commercial Ownership & Terms of Service'}
                  </h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">/Legal/TERMS_OF_SERVICE.md</span>
                </div>

                <div className="space-y-3 leading-relaxed text-slate-700">
                  <p>
                    {isAr
                      ? '1. **الملكية التجارية الحرة 100%:** كافة الشعارات، الأيقونات، البنرات، وملفات Favicon التي تصممها باستخدام التطبيق هي ملكيتك الحصرية بدون أي قيود، أو عمولات، أو حقوق ملكية لاحقة.'
                      : '1. **100% Commercial Ownership:** All vector logos, favicons, banners, and app icons created with this tool are strictly your property for unlimited personal and commercial use without royalty fees.'}
                  </p>
                  <p>
                    {isAr
                      ? '2. **تسجيل العلامة التجارية:** يحق للمستخدم تسجيل الشعارات والأيقونات المصممة كعلامات تجارية مسجلة رسمياً للشركات والتطبيقات والمتاجر.'
                      : '2. **Trademark Registration:** Users are fully authorized to register their exported designs as official corporate or app trademarks worldwide.'}
                  </p>
                  <p>
                    {isAr
                      ? '3. **التوافق مع Google Play:** التطبيق مصمم ومبني بالكامل وفق إرشادات مطوري Google Play وسياسات توزيع التطبيقات الرسمية.'
                      : '3. **Google Play Alignment:** This software is fully designed and maintained in adherence with the Google Play Developer Distribution Agreement.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. LEGAL MARKDOWN DOCS EXPLORER TAB */}
          {activeTab === 'legal-docs' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2 text-indigo-950">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FolderArchive className="h-4 w-4 text-indigo-600" />
                  <span>{isAr ? 'مجلد المستندات القانونية (Legal Folder Documents)' : 'Legal Folder Markdown Documents'}</span>
                </h3>
                <p className="text-xs text-indigo-800">
                  {isAr
                    ? 'تم إنشاء مجلد Legal متكامل يحتوي على ملفات Markdown النموذجية الجاهزة للاستضافة المباشرة أو تضمينها في موقعك:'
                    : 'The project includes a dedicated Legal folder with markdown files ready for deployment and hosting:'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Doc 1: Privacy Policy */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-600" />
                      <span className="font-bold text-xs text-slate-900">PRIVACY_POLICY.md</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                      /Legal/PRIVACY_POLICY.md
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isAr
                      ? 'ملف سياسة الخصوصية الشامل المتوافق مع متطلبات متجر Google Play وقوانين حماية البيانات.'
                      : 'Full privacy declarations detailing client-side storage, device permissions, and zero tracking.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => downloadFile('PRIVACY_POLICY.md', PRIVACY_POLICY_MD)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>{isAr ? 'تنزيل الملف' : 'Download .md'}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(PRIVACY_POLICY_MD, 'legal-privacy-md')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedSection === 'legal-privacy-md' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{isAr ? 'نسخ Markdown' : 'Copy MD'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Doc 2: Terms of Service */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span className="font-bold text-xs text-slate-900">TERMS_OF_SERVICE.md</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                      /Legal/TERMS_OF_SERVICE.md
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isAr
                      ? 'ملف شروط الخدمة واتفاقية الاستخدام والترخيص التجاري الدائم والمجاني للمستخدم.'
                      : 'Commercial rights agreement, perpetual licensing terms, and liability limits.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => downloadFile('TERMS_OF_SERVICE.md', TERMS_OF_SERVICE_MD)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>{isAr ? 'تنزيل الملف' : 'Download .md'}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(TERMS_OF_SERVICE_MD, 'legal-terms-md')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedSection === 'legal-terms-md' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{isAr ? 'نسخ Markdown' : 'Copy MD'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. GOOGLE PLAY CHECKLIST TAB */}
          {activeTab === 'google-play-checklist' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2 text-indigo-950">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                  <span>{isAr ? 'قائمة التحقق الرسمية لمتجر Google Play Store' : 'Official Google Play Store Launch Checklist'}</span>
                </h3>
                <p className="text-xs text-indigo-800">
                  {isAr
                    ? 'تأكد من استيفاء جميع المتطلبات البصرية والتقنية التالية قبل رفع حزمة التطبيق (AAB/APK):'
                    : 'Ensure all graphic assets and policy requirements below are prepared for your Play Console store listing:'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item 1: App Icon */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {isAr ? '1. أيقونة التطبيق (App Icon)' : '1. High-Res App Icon'}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      512 × 512 px
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isAr
                      ? 'صيغة PNG مع قناة ألفا (32-bit)، أقصى حجم 1024KB، بدون حواف دائرية مقصوصة مسبقاً لأن جوجل تطبق قناع السكويركل تلقائياً.'
                      : '32-bit PNG with alpha, max 1024KB. Keep it square with sharp edges; Google Play automatically applies the rounded corner mask.'}
                  </p>
                </div>

                {/* Item 2: Feature Graphic */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {isAr ? '2. الصورة المميزة (Feature Graphic)' : '2. Feature Graphic'}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                      1024 × 500 px
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isAr
                      ? 'صيغة JPG أو PNG بدون شفافية، مع مراعاة منطقة الأمان (Safe Zone 15%) من الحواف وعدم وضع تقييمات مضللة.'
                      : 'JPG or 24-bit PNG without transparency. Maintain 15% safe margin from edges for title and prominent badges.'}
                  </p>
                </div>

                {/* Item 3: Target SDK */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {isAr ? '3. الإصدار والهدف (Target SDK)' : '3. Target SDK & Platform'}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      Android 14+ (API 34)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isAr
                      ? 'تنسيق حزمة التطبيقات Android App Bundle (.aab) متوافق مع سياسات الأمان الحديثة.'
                      : 'Signed Android App Bundle (.aab) adhering to the latest Google Play 64-bit and Target SDK policies.'}
                  </p>
                </div>

                {/* Item 4: Content Rating */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {isAr ? '4. تصنيف المحتوى (IARC Rating)' : '4. Content Rating'}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                      Everyone / للجميع
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isAr
                      ? 'تطبيق إنتاجية وأدوات تصميم، مناسب لجميع الأعمار ولا يحتوي على أي محتوى حساس.'
                      : 'Design & Productivity utility tool suitable for general audiences with zero mature content.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. DATA SAFETY FORM TAB */}
          {activeTab === 'data-safety' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-950">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{isAr ? 'إجابات قسم أمان البيانات في Google Play Console (Data Safety)' : 'Play Console Data Safety Form Guidance'}</span>
                </h3>
                <p className="text-xs text-emerald-800">
                  {isAr
                    ? 'عند تعبئة استبيان أمان البيانات (Data Safety) في Google Play Console، يمكنك استخدام هذه الإجابات المطابقة:'
                    : 'Use these exact declarations when filling the mandatory Data Safety questionnaire in Google Play Console:'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs">
                      {isAr ? 'هل يجمع التطبيق أو يشارك أي بيانات مستخدم؟' : 'Does your app collect or share any user data?'}
                    </strong>
                    <span className="text-xs text-slate-600">
                      {isAr ? 'الإجابة: لا (No)، جميع التصميمات تتم محلياً على جهاز المستخدم.' : 'Answer: No. All graphic transformations occur on-device.'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs">
                      {isAr ? 'هل يتم تشفير البيانات أثناء النقل؟' : 'Is data encrypted in transit?'}
                    </strong>
                    <span className="text-xs text-slate-600">
                      {isAr ? 'الإجابة: نعم (Yes)، أي اتصالات مع واجهة الذكاء الاصطناعي تتم عبر بروتوكول HTTPS المشفر.' : 'Answer: Yes. Any network communication uses HTTPS TLS encryption.'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs">
                      {isAr ? 'هل يمكن للمستخدم طلب حذف بياناته؟' : 'Can users request data deletion?'}
                    </strong>
                    <span className="text-xs text-slate-600">
                      {isAr ? 'الإجابة: نعم (Yes)، يمكن للمستخدم مسح مشاريعه المحفوظة بضغطة زر أو بمسح بيانات التطبيق.' : 'Answer: Yes. Users can delete all saved projects directly within the app.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            {isAr ? 'البريد المعتمد: anwarasbas2018@gmail.com' : 'Support: anwarasbas2018@gmail.com'}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
