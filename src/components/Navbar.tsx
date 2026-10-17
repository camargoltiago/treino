import React from 'react';
import { Home, Dumbbell, Activity, TrendingUp, Clock } from 'lucide-react';

export type TabType = 'today' | 'workouts' | 'recovery' | 'progress' | 'history';

interface NavbarProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  hasActiveSession: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onChangeTab, hasActiveSession }) => {
  const tabs = [
    { id: 'today', label: 'Hoje', icon: Home },
    { id: 'recovery', label: 'Músculos', icon: Activity },
    { id: 'workouts', label: 'Treino', icon: Dumbbell, hasBadge: hasActiveSession },
    { id: 'progress', label: 'Evolução', icon: TrendingUp },
    { id: 'history', label: 'Histórico', icon: Clock }
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-dark-bg/95 backdrop-blur-xl border-t border-dark-border select-none shadow-[0_-10px_30px_rgba(0,0,0,0.7)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center gap-1 transition-all relative active:scale-90 ${
                isActive ? 'text-mint-500 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Ícone */}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]' : ''}`} />
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-mint-500 animate-ping"></span>
                )}
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-mint-500"></span>
                )}
              </div>

              {/* Rótulo */}
              <span className={`text-[10px] tracking-tight ${isActive ? 'text-mint-400 font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>

              {/* Indicador de barra ativa sob a aba */}
              {isActive && (
                <span className="absolute bottom-1 w-5 h-1 rounded-full bg-mint-500 shadow-mint-glow-sm"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
