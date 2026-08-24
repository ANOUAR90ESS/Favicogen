import React, { useState, useMemo } from 'react';
import {
  Youtube,
  Download,
  Eye,
  Sliders,
  CheckCircle2,
  Sparkles,
  Monitor,
  Smartphone,
  ShieldCheck,
  Play,
  Bell,
  Search,
  X
} from 'lucide-react';
import { LogoConfig, SocialBannerOptions } from '../types';
import {
  generateSocialBannerSvg,
  generateSvgString,
  generateYouTubeKitZip,
  downloadBlob,
  rasterizeSvg,
  renderSvgToBlob,
} from '../utils/canvasRenderer';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

interface YouTubeKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
  onOpenAIGenerator: () => void;
}

export const YouTubeKitModal: React.FC<YouTubeKitModalProps> = ({
  isOpen,
  onClose,
  config,
  onOpenAIGenerator,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'banner' | 'avatar' | 'watermark' | 'thumbnail' | 'channel-mockup'>('banner');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Customization state
  const [channelTitle, setChannelTitle] = useState<string>(config.text || config.name || 'قناتي على يوتيوب');
  const [channelHandle, setChannelHandle] = useState<string>(`@${(config.text || 'channel').toLowerCase().replace(/\s+/g, '')}`);
  const [channelTagline, setChannelTagline] = useState<string>(config.tagline || 'شروحات، محتوى حصري، وبثوث مباشرة يومية');
  const [uploadSchedule, setUploadSchedule] = useState<string>('فيديوهات جديدة كل أسبوع');
  const [subscribersMock] = useState<string>('128 ألف مشترك');
  const [selectedTheme, setSelectedTheme] = useState<'youtube-red' | 'dark' | 'brand' | 'cyberpunk' | 'royal-gold' | 'emerald'>('youtube-red');
  const [selectedLayout, setSelectedLayout] = useState<'youtube-channel' | 'center-hero' | 'split-hero' | 'minimal-clean'>('youtube-channel');

  const bannerOptions: SocialBannerOptions = useMemo(() => ({
    layout: selectedLayout,
    bgTheme: selectedTheme,
    title: channelTitle,
    subtitle: channelTagline,
    channelHandle,
    uploadSchedule,
    showBadge: true,
    badgeText: 'قناة رسمية معتمدة • 2026',
    showGlowEffect: true,
    showSafeZone: showSafeZones,
  }), [selectedLayout, selectedTheme, channelTitle, channelTagline, channelHandle, uploadSchedule, showSafeZones]);

  // Generate real-time banner SVG
  const bannerSvg = useMemo(() => {
    return generateSocialBannerSvg(config, bannerOptions, 2560, 1440);
  }, [config, bannerOptions]);

  // Generate real-time avatar SVG (800x800)
  const avatarSvg = useMemo(() => {
    return generateSvgString(config, 800);
  }, [config]);

  // Generate real-time thumbnail SVG (1280x720)
  const thumbSvg = useMemo(() => {
    return generateSocialBannerSvg(
      config,
      { ...bannerOptions, showSafeZone: false },
      1280,
      720
    );
  }, [config, bannerOptions]);

  const handleDownloadAllZip = async () => {
    setIsExportingZip(true);
    try {
      const blob = await generateYouTubeKitZip(config, bannerOptions);
      const filename = `youtube_kit_${(channelTitle || 'channel').replace(/\s+/g, '_')}_2026.zip`;
      downloadBlob(blob, filename);
      triggerToast('🎉 تم تحميل حزمة قنوات يوتيوب الكاملة بنجاح!');
    } catch (err) {
      console.error('Failed to export YouTube kit zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadSingleAsset = async (assetType: 'banner' | 'avatar' | 'watermark' | 'thumbnail') => {
    try {
      let blob: Blob;
      let filename: string;
      const safeName = (channelTitle || 'channel').replace(/\s+/g, '_');

      if (assetType === 'banner') {
        const svg = generateSocialBannerSvg(config, { ...bannerOptions, showSafeZone: false }, 2560, 1440);
        blob = await rasterizeSvg(svg, 2560, 1440, 'png');
        filename = `youtube_banner_2560x1440_${safeName}.png`;
      } else if (assetType === 'avatar') {
        blob = await renderSvgToBlob(avatarSvg, 800, 'png');
        filename = `youtube_avatar_800x800_${safeName}.png`;
      } else if (assetType === 'watermark') {
        blob = await renderSvgToBlob(avatarSvg, 150, 'png');
        filename = `youtube_watermark_150x150_${safeName}.png`;
      } else {
        const svg = generateSocialBannerSvg(config, { ...bannerOptions, showSafeZone: false }, 1280, 720);
        blob = await rasterizeSvg(svg, 1280, 720, 'png');
        filename = `youtube_thumbnail_1280x720_${safeName}.png`;
      }

      downloadBlob(blob, filename);
      triggerToast(`✅ تم تحميل ${filename}`);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('youtubeKitModal.title')}
      className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      overlayClassName="z-50 p-4 sm:p-6"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 text-white">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  أستوديو قنوات YouTube المتكامل (YouTube Channel Branding Kit)
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  2560 × 1440 HD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                صمّم غلاف القناة، صورة البروفايل، العلامة المائية، والمصغرات وفق معايير يوتيوب الرسمية 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAIGenerator}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>توليد أفكار بالذكاء الاصطناعي</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {copiedNotification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            {copiedNotification}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
          {[
            { id: 'banner', label: 'غلاف وبانر القناة (2560×1440)', icon: Monitor },
            { id: 'channel-mockup', label: 'معاينة صفحة القناة الحية', icon: Eye },
            { id: 'avatar', label: 'صورة البروفايل (800×800)', icon: Smartphone },
            { id: 'watermark', label: 'العلامة المائية للفيديو (150×150)', icon: ShieldCheck },
            { id: 'thumbnail', label: 'الصورة المصغرة (1280×720)', icon: Play },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-red-500 text-white bg-red-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Preview Stage (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Viewport Control Bar */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">منطقة الأمان (Safe Area Guide):</span>
                <button
                  type="button"
                  onClick={() => setShowSafeZones(!showSafeZones)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                    showSafeZones
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {showSafeZones ? 'مفعّلة (1546 × 423)' : 'مخفية'}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-rose-500" />
                  منطقة الهاتف المضمونة
                </span>
                <span className="flex items-center gap-1 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/40 border border-indigo-500" />
                  سطح المكتب والتابلت
                </span>
              </div>
            </div>

            {/* Stage Preview Box */}
            <div className="flex-1 min-h-[380px] bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex items-center justify-center relative overflow-hidden shadow-inner">
              {/* 1. Full Banner View */}
              {activeTab === 'banner' && (
                <div className="w-full flex flex-col items-center gap-3">
                  <div
                    className="w-full max-w-4xl aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900"
                    dangerouslySetInnerHTML={{ __html: bannerSvg }}
                  />
                  <div className="flex items-center justify-between w-full max-w-4xl text-xs text-slate-400 px-1">
                    <span className="font-mono">الأبعاد: 2560 × 1440 px (16:9 4K/FullHD)</span>
                    <button
                      onClick={() => handleDownloadSingleAsset('banner')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      تحميل بانر 2560x1440 كصورة PNG
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Live YouTube Channel Page Mockup */}
              {activeTab === 'channel-mockup' && (
                <div className="w-full max-w-4xl bg-[#0f0f0f] border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-white text-xs">
                  {/* YouTube Top Bar */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f0f0f] border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 font-bold text-sm tracking-tighter text-white">
                        <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center text-[10px]">
                          ▶
                        </div>
                        YouTube
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center bg-[#222] border border-slate-700 rounded-full px-3 py-1 w-64 text-slate-400">
                      <Search className="w-3 h-3 mr-2" />
                      <span>بحث...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-slate-300" />
                      <div
                        className="w-7 h-7 rounded-full bg-indigo-600 overflow-hidden border border-slate-700"
                        dangerouslySetInnerHTML={{ __html: avatarSvg }}
                      />
                    </div>
                  </div>

                  {/* Channel Header Banner */}
                  <div
                    className="w-full aspect-[6/1] bg-slate-800 overflow-hidden relative"
                    dangerouslySetInnerHTML={{
                      __html: generateSocialBannerSvg(
                        config,
                        { ...bannerOptions, showSafeZone: false },
                        1800,
                        300
                      ),
                    }}
                  />

                  {/* Channel Profile Info Header */}
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 bg-[#0f0f0f]">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-slate-900 shrink-0"
                        dangerouslySetInnerHTML={{ __html: avatarSvg }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">{channelTitle}</h3>
                          <span className="w-4 h-4 rounded-full bg-slate-400 text-black text-[9px] font-bold flex items-center justify-center">
                            ✓
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {channelHandle} • {subscribersMock} • 140 فيديو
                        </p>
                        <p className="text-xs text-slate-300 line-clamp-1">{channelTagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-slate-200 transition">
                        اشتراك (Subscribe)
                      </button>
                      <button className="px-3 py-2 rounded-full bg-slate-800 text-white font-medium text-xs hover:bg-slate-700 transition">
                        انضمام
                      </button>
                    </div>
                  </div>

                  {/* Mock Video Grid */}
                  <div className="p-4 grid grid-cols-3 gap-3 bg-[#0f0f0f]">
                    {[1, 2, 3].map((v) => (
                      <div key={v} className="space-y-1.5">
                        <div
                          className="aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700/60"
                          dangerouslySetInnerHTML={{ __html: thumbSvg }}
                        />
                        <div className="text-[11px] font-bold text-white truncate">
                          {channelTitle} - فيديو حصري رقم #{v}
                        </div>
                        <div className="text-[10px] text-slate-400">45 ألف مشاهدة • قبل 3 أيام</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Avatar View */}
              {activeTab === 'avatar' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-8">
                    {/* Square standard */}
                    <div className="space-y-2 text-center">
                      <div
                        className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: avatarSvg }}
                      />
                      <span className="text-xs text-slate-400 font-mono">800 × 800 px (مربع أصلي)</span>
                    </div>

                    {/* Circle YouTube preview */}
                    <div className="space-y-2 text-center">
                      <div
                        className="w-40 h-40 rounded-full overflow-hidden border-4 border-red-500/50 bg-slate-900 shadow-2xl ring-4 ring-red-500/20"
                        dangerouslySetInnerHTML={{ __html: avatarSvg }}
                      />
                      <span className="text-xs text-red-400 font-semibold">المعاينة الدائرية على يوتيوب</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadSingleAsset('avatar')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 mt-2"
                  >
                    <Download className="w-4 h-4" />
                    تحميل صورة البروفايل (800×800 PNG)
                  </button>
                </div>
              )}

              {/* 4. Watermark View */}
              {activeTab === 'watermark' && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative w-72 aspect-video bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
                    <div className="text-slate-600 text-xs font-mono">منطقة تشغيل الفيديو (Video Player)</div>
                    {/* Watermark in bottom right */}
                    <div
                      className="absolute bottom-2 right-2 w-10 h-10 rounded border border-white/40 shadow-lg bg-black/50"
                      dangerouslySetInnerHTML={{ __html: avatarSvg }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">علامة مائية مخصصة تظهر في زاوية جميع فيديوهاتك</p>
                    <p className="text-[11px] text-slate-400">المقاس القياسي: 150 × 150 px بخلفية شفافة أو مفرغة</p>
                  </div>
                  <button
                    onClick={() => handleDownloadSingleAsset('watermark')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    تحميل العلامة المائية (150×150 PNG)
                  </button>
                </div>
              )}

              {/* 5. Thumbnail View */}
              {activeTab === 'thumbnail' && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div
                    className="w-full max-w-lg aspect-video rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl"
                    dangerouslySetInnerHTML={{ __html: thumbSvg }}
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">صورة مصغرة عالية الجودة (HD Thumbnail)</p>
                    <p className="text-[11px] text-slate-400">الأبعاد: 1280 × 720 px (16:9 مصغرات يوتيوب الرسمية)</p>
                  </div>
                  <button
                    onClick={() => handleDownloadSingleAsset('thumbnail')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    تحميل الصورة المصغرة (1280×720 PNG)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right / Customizer Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 overflow-y-auto max-h-[580px]">
            <div className="border-b border-slate-800/80 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-red-400" />
                تخصيص بيانات القناة:
              </span>
            </div>

            {/* Channel Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">اسم القناة (Channel Name):</label>
              <input
                type="text"
                value={channelTitle}
                onChange={(e) => setChannelTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Channel Handle */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">المعرّف الرسمي (Handle):</label>
              <input
                type="text"
                value={channelHandle}
                onChange={(e) => setChannelHandle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* Tagline / Subtitle */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">وصف أو شعار القناة:</label>
              <input
                type="text"
                value={channelTagline}
                onChange={(e) => setChannelTagline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Upload Schedule */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">جدول النشر (Upload Schedule):</label>
              <input
                type="text"
                value={uploadSchedule}
                onChange={(e) => setUploadSchedule(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-400 block">ثيم وألوان الغلاف:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'youtube-red', label: 'يوتيوب أحمر & أسود', color: 'from-red-950 to-black' },
                  { id: 'dark', label: 'أوبسيديان داكن', color: 'from-slate-900 to-black' },
                  { id: 'royal-gold', label: 'ذهبي ملكي فاخر', color: 'from-amber-950 to-black' },
                  { id: 'cyberpunk', label: 'نيون سايبر بانك', color: 'from-purple-900 to-pink-900' },
                  { id: 'emerald', label: 'زمردي عصري', color: 'from-emerald-950 to-teal-900' },
                  { id: 'brand', label: 'ألوان الشعار الحالي', color: 'from-indigo-900 to-blue-900' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setSelectedTheme(th.id as any)}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold text-right transition flex items-center justify-between ${
                      selectedTheme === th.id
                        ? 'border-red-500 bg-red-500/15 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{th.label}</span>
                    <span className={`w-3 h-3 rounded-full bg-gradient-to-tr ${th.color} border border-white/20`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-400 block">توزيع العناصر في الغلاف:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'youtube-channel', label: 'توزيع قنوات يوتيوب الآمن' },
                  { id: 'center-hero', label: 'توسيط هيدر رئيسي' },
                  { id: 'split-hero', label: 'شعار يمين + نصوص يسار' },
                  { id: 'minimal-clean', label: 'شعار نقي وبسيط' },
                ].map((ly) => (
                  <button
                    key={ly.id}
                    onClick={() => setSelectedLayout(ly.id as any)}
                    className={`px-2 py-2 rounded-lg border text-[11px] font-semibold text-right transition truncate ${
                      selectedLayout === ly.id
                        ? 'border-red-500 bg-red-500/15 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ly.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Export ZIP Button */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isExportingZip}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.99] shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExportingZip ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري تجميع حزمة YouTube (.ZIP)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تصدير حزمة YouTube الكاملة (ZIP)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-1.5">
                تشمل: البانر 2560x1440 + دليل الأمان + البروفايل + العلامة المائية + المصغرة + ملف SVG المصدري
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>متوافق 100% مع معايير YouTube Studio الرسمية 2026</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            إغلاق
          </button>
        </div>
      </Modal>
  );
};
