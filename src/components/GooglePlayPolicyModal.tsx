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
  Lock,
  Award,
  Check,
  FolderArchive,
  } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { PRIVACY_POLICY_MD, PRIVACY_POLICY_AR, PRIVACY_POLICY_URL } from '../Legal/privacyPolicy';
import { TERMS_OF_SERVICE_MD, TERMS_OF_SERVICE_AR, TERMS_OF_SERVICE_URL } from '../Legal/termsOfService';
import { downloadText } from '../utils/download';
import { Modal } from './Modal';

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const activePrivacyText = isAr ? PRIVACY_POLICY_AR : PRIVACY_POLICY_MD;
  const activeTermsText = isAr ? TERMS_OF_SERVICE_AR : TERMS_OF_SERVICE_MD;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('policyModal.privacyGooglePlayPolicies')}
      className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      overlayClassName="z-50 p-3 sm:p-6"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                {t('policyModal.privacyPolicyGooglePlay')}
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {t('policyModal.productionReady')}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {t('policyModal.officialPrivacyPolicyCommercial')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title={t('policyModal.close')}
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed custom-scrollbar select-text">
          {/* 1. PRIVACY POLICY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-xs">
                    {t('policyModal.productionReadyPrivacyPolicy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadText(activePrivacyText, 'PRIVACY_POLICY.md', 'text/markdown')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>{t('policyModal.downloadMd')}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(activePrivacyText, 'privacy-text')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedSection === 'privacy-text' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{t('policyModal.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t('policyModal.copyPolicy')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Formatted Policy Document */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 font-sans text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {t('policyModal.officialPrivacyPolicyLogo')}
                  </h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">{PRIVACY_POLICY_URL[isAr ? 'ar' : 'en']}</span>
                </div>

                <div className="space-y-3 leading-relaxed">
                  <p>
                    <strong>{t('policyModal.lastUpdated')}</strong> 24 August 2026
                  </p>
                  <p>
                    {t('policyModal.weAreCommittedProtecting')}
                  </p>

                  <h4 className="font-bold text-slate-900 pt-2">
                    {t('policyModal.text1DataCollectionProcessing')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>
                      {t('policyModal.noPersonalIdentificationPhone')}
                    </li>
                    <li>
                      {t('policyModal.exportedGraphicAssetsAre')}
                    </li>
                  </ul>

                  <h4 className="font-bold text-slate-900 pt-2">
                    {t('policyModal.text2DevicePermissions')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>
                      <strong>{t('policyModal.storageFileAccess')}</strong>{' '}
                      {t('policyModal.usedStrictlyAllowYou')}
                    </li>
                    <li>
                      <strong>{t('policyModal.internetNetwork')}</strong>{' '}
                      {t('policyModal.usedSolelyGoogleWeb')}
                    </li>
                  </ul>

                  <h4 className="font-bold text-slate-900 pt-2">
                    {t('policyModal.text3DeveloperContact')}
                  </h4>
                  <p className="text-slate-600">
                    {t('policyModal.officialDeveloperContactEmail')}{' '}
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
                    {t('policyModal.text100FullCommercialOwnership')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadText(activeTermsText, 'TERMS_OF_SERVICE.md', 'text/markdown')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>{t('policyModal.downloadMd2')}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(activeTermsText, 'terms-text')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedSection === 'terms-text' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{t('policyModal.copied2')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t('policyModal.copyTerms')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 font-sans text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {t('policyModal.commercialOwnershipTermsService')}
                  </h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">{TERMS_OF_SERVICE_URL[isAr ? 'ar' : 'en']}</span>
                </div>

                <div className="space-y-3 leading-relaxed text-slate-700">
                  <p>
                    {t('policyModal.text1100CommercialOwnership')}
                  </p>
                  <p>
                    {t('policyModal.text2TrademarkRegistrationUsers')}
                  </p>
                  <p>
                    {t('policyModal.text3GooglePlayAlignment')}
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
                  <span>{t('policyModal.legalFolderMarkdownDocuments')}</span>
                </h3>
                <p className="text-xs text-indigo-800">
                  {t('policyModal.theProjectIncludesDedicated')}
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
                      {PRIVACY_POLICY_URL[isAr ? 'ar' : 'en']}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('policyModal.fullPrivacyDeclarationsDetailing')}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => downloadText(PRIVACY_POLICY_MD, 'PRIVACY_POLICY.md', 'text/markdown')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>{t('policyModal.downloadMd3')}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(PRIVACY_POLICY_MD, 'legal-privacy-md')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedSection === 'legal-privacy-md' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{t('policyModal.copied3')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t('policyModal.copyMd')}</span>
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
                      {TERMS_OF_SERVICE_URL[isAr ? 'ar' : 'en']}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('policyModal.commercialRightsAgreementPerpetual')}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => downloadText(TERMS_OF_SERVICE_MD, 'TERMS_OF_SERVICE.md', 'text/markdown')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>{t('policyModal.downloadMd4')}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(TERMS_OF_SERVICE_MD, 'legal-terms-md')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedSection === 'legal-terms-md' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{t('policyModal.copied4')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t('policyModal.copyMd2')}</span>
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
                  <span>{t('policyModal.officialGooglePlayStore')}</span>
                </h3>
                <p className="text-xs text-indigo-800">
                  {t('policyModal.ensureAllGraphicAssets')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item 1: App Icon */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {t('policyModal.text1HighResApp')}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      512 × 512 px
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('policyModal.text32BitPngAlpha')}
                  </p>
                </div>

                {/* Item 2: Feature Graphic */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {t('policyModal.text2FeatureGraphic')}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                      1024 × 500 px
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('policyModal.jpg24BitPng')}
                  </p>
                </div>

                {/* Item 3: Target SDK */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {t('policyModal.text3TargetSdkPlatform')}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      Android 14+ (API 34)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('policyModal.signedAndroidAppBundle')}
                  </p>
                </div>

                {/* Item 4: Content Rating */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {t('policyModal.text4ContentRating')}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                      Everyone / للجميع
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('policyModal.designProductivityUtilityTool')}
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
                  <span>{t('policyModal.playConsoleDataSafety')}</span>
                </h3>
                <p className="text-xs text-emerald-800">
                  {t('policyModal.useTheseExactDeclarations')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs">
                      {t('policyModal.doesAppCollectShare')}
                    </strong>
                    <span className="text-xs text-slate-600">
                      {t('policyModal.answerNoAllGraphic')}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs">
                      {t('policyModal.isDataEncryptedTransit')}
                    </strong>
                    <span className="text-xs text-slate-600">
                      {t('policyModal.answerYesAnyNetwork')}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs">
                      {t('policyModal.canUsersRequestData')}
                    </strong>
                    <span className="text-xs text-slate-600">
                      {t('policyModal.answerYesUsersCan')}
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
            {t('policyModal.supportAnwarasbas2018GmailCom')}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            {t('policyModal.close2')}
          </button>
        </div>
      </Modal>
  );
};
