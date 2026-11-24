import React, { ReactNode, useState } from 'react';
import { ArrowLeft, MapPin, ShieldCheck, Store } from 'lucide-react';
import villageHeroImg from '../../../assets/images/auth_village_marketplace_hero_1795426740149.jpg';
import thaliGroceryImg from '../../../assets/images/auth_thali_grocery_stilllife_1795426742404.jpg';
import { AuthScreenType } from '../types';

export interface AuthLayoutProps {
  activeScreen: AuthScreenType;
  visualVariant?: 'marketplace' | 'culinary';
  editorialEyebrow: string;
  editorialHeading: string;
  editorialSubtext: string;
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
  children: ReactNode;
}

const SCREEN_PREVIEW_LINKS: { id: AuthScreenType; label: string }[] = [
  { id: 'LOGIN', label: 'Login' },
  { id: 'SIGNUP', label: 'Sign Up' },
  { id: 'FORGOT_PASSWORD', label: 'Forgot Password' },
  { id: 'RESET_PASSWORD', label: 'Reset Password' },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  activeScreen,
  visualVariant = 'marketplace',
  editorialEyebrow,
  editorialHeading,
  editorialSubtext,
  onChangeScreen,
  onReturnToMarketplace,
  children,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const heroSrc =
    visualVariant === 'culinary' ? thaliGroceryImg : villageHeroImg;
  const heroAlt =
    visualVariant === 'culinary'
      ? 'Traditional Indian vegetarian thali served with fresh local produce, spices, and household groceries on natural stone'
      : 'Sunlit modern Indian village marketplace stall with woven cane baskets of fresh vegetables, grains, spices, and local goods';

  return (
    <div className="auth-surface min-h-screen bg-[#F8FAFC] text-[#1F2937] flex flex-col lg:grid lg:grid-cols-12">
      {/* LEFT EDITORIAL MARKETPLACE SHOWCASE (Desktop full-height / Mobile compact visual header) */}
      <aside className="relative lg:col-span-5 xl:col-span-5 bg-[#122D1C] text-white overflow-hidden flex flex-col justify-between min-h-[210px] sm:min-h-[240px] lg:min-h-screen">
        {/* Resilient Photography Layer with Deep Forest Fallback */}
        <div
          className="absolute inset-0 bg-[#122D1C]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(33, 136, 56, 0.35), transparent 60%)',
          }}
          aria-hidden="true"
        />

        {!imageFailed && (
          <img
            src={heroSrc}
            alt={heroAlt}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.01]"
          />
        )}

        {/* Measured Contrast Scrim (>= 4.5:1 readability over sunlit imagery) */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0B1E13]/95 via-[#0F281A]/60 to-[#0B1E13]/55"
          aria-hidden="true"
        />

        {/* Top Brand Lockup inside Editorial Panel */}
        <div className="relative z-10 px-6 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onReturnToMarketplace}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#218838] border border-white/25 text-white flex items-center justify-center font-extrabold text-base shadow-sm transition-transform group-hover:scale-105">
              GB
            </div>
            <div>
              <span className="auth-display block text-lg font-extrabold tracking-tight text-white leading-tight">
                GramBazaar
              </span>
              <span className="block text-[11px] font-medium tracking-wide text-emerald-100/85">
                Gaon Ka Apna Bazaar
              </span>
            </div>
          </button>

          {/* Compact mobile return action */}
          <button
            type="button"
            onClick={onReturnToMarketplace}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition-colors py-2 px-2.5 rounded-full hover:bg-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Bottom Editorial Copy & Village Trust Highlights */}
        <div className="relative z-10 px-6 pb-6 pt-8 sm:px-8 sm:pb-8 lg:px-10 lg:pb-12 space-y-5">
          <div className="space-y-2.5 max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FCD34D]">
              {editorialEyebrow}
            </p>
            <h2 className="auth-display text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold tracking-tight text-white leading-[1.15]">
              {editorialHeading}
            </h2>
            <p className="hidden sm:block text-sm text-emerald-50/85 leading-relaxed">
              {editorialSubtext}
            </p>
          </div>

          {/* Unboxed Horizontal Trust Highlights — Zero Pill Clutter */}
          <div className="hidden lg:block pt-5 border-t border-white/15">
            <div className="grid grid-cols-3 gap-4 text-xs text-emerald-50/90">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <Store className="w-3.5 h-3.5 text-[#86EFAC] shrink-0" />
                  <span>Local Shops</span>
                </div>
                <p className="text-[11px] text-emerald-100/70 leading-snug">
                  Trusted kirana &amp; village kitchens
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#86EFAC] shrink-0" />
                  <span>Nearby Delivery</span>
                </div>
                <p className="text-[11px] text-emerald-100/70 leading-snug">
                  Doorstep drop or store pickup
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#86EFAC] shrink-0" />
                  <span>Direct Trust</span>
                </div>
                <p className="text-[11px] text-emerald-100/70 leading-snug">
                  Fair pricing &amp; udhari support
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT AUTHENTICATION WORKSPACE */}
      <main className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between min-h-[calc(100vh-210px)] lg:min-h-screen px-4 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
        {/* Top Utility Bar */}
        <div className="w-full max-w-[480px] mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onReturnToMarketplace}
            className="hidden lg:inline-flex items-center gap-2 text-xs font-semibold text-[#6B7280] hover:text-[#218838] transition-colors py-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to GramBazaar Marketplace</span>
          </button>

          <p className="text-[11px] font-medium text-[#6B7280] tracking-wide ml-auto">
            Rampur Kalan &middot; Devgarh &middot; Local Marketplace
          </p>
        </div>

        {/* Single-Elevation Form Card */}
        <div className="w-full max-w-[480px] mx-auto my-6 sm:my-8">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 sm:p-9 animate-fade-in">
            {children}
          </div>
        </div>

        {/* Clean Footer with Direct UI Preview Switcher */}
        <footer className="w-full max-w-[480px] mx-auto pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <nav
            aria-label="Authentication screens"
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5"
          >
            {SCREEN_PREVIEW_LINKS.map((item, idx) => (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  onClick={() => onChangeScreen(item.id)}
                  className={`transition-colors cursor-pointer ${
                    activeScreen === item.id
                      ? 'text-[#218838] font-semibold'
                      : 'text-[#6B7280] hover:text-[#1F2937]'
                  }`}
                >
                  {item.label}
                </button>
                {idx < SCREEN_PREVIEW_LINKS.length - 1 && (
                  <span className="text-[#CBD5E1]" aria-hidden="true">
                    &middot;
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <span className="text-[11px] text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} GramBazaar
          </span>
        </footer>
      </main>
    </div>
  );
};
