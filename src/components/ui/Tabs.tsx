import React, { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}) => {
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-1.5 bg-[#F1F5F9] rounded-full border border-[#E5E7EB] ${className}`}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 cursor-pointer select-none
                ${
                  isActive
                    ? 'bg-[#218838] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-white/50'
                }`}
            >
              {tab.icon && (
                <span className="inline-flex shrink-0">{tab.icon}</span>
              )}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant for enterprise navigation
  return (
    <div
      className={`flex items-center gap-6 border-b border-[#E5E7EB] overflow-x-auto ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer select-none
              ${
                isActive
                  ? 'border-[#218838] text-[#218838] font-semibold'
                  : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-[#CBD5E1]'
              }`}
          >
            {tab.icon && (
              <span className="inline-flex shrink-0">{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-[#E8F5E9] text-[#176B2C]' : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
