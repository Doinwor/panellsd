import React from 'react';
import { useCatalog } from '../context/CatalogContext';
import {
  RefreshCw,
  Download,
  UploadCloud,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  LogOut,
  LayoutDashboard,
  Users,
  Disc,
  Music,
  Film,
  Newspaper,
  Radio,
  Settings,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPublishModal: () => void;
  onOpenUploadModal: () => void;
  onOpenGitHubSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenPublishModal,
  onOpenUploadModal,
  onOpenGitHubSync,
}) => {
  const { currentProfile, logout } = useAuth();
  const {
    repo,
    userProfile,
    isTokenValid,
    isVerifyingToken,
    isLoading,
    refreshCatalog,
    downloadJson,
    diffs,
    hasUnsavedChanges,
    pendingFiles,
    catalog,
  } = useCatalog();

  const navItems = [
    { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
    { id: 'artists', label: 'Артисты', icon: Users, badge: catalog?.customArtists.length },
    { id: 'albums', label: 'Альбомы', icon: Disc, badge: catalog?.customAlbums.length },
    { id: 'tracks', label: 'Треки', icon: Music, badge: catalog?.customTracks.length },
    { id: 'videos', label: 'Клипы', icon: Film, badge: catalog?.customVideos.length },
    { id: 'news', label: 'Новости', icon: Newspaper, badge: catalog?.customNews.length },
    { id: 'broadcasts', label: 'Оповещения', icon: Radio },
    { id: 'storage', label: 'Медиафайлы', icon: HardDrive },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 transition-all select-none">
      {/* Top Tier: Logo, Admin Profile, GitHub Info & Global Actions */}
      <div className="w-full border-b border-zinc-900/90 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand & Active Admin Info (Left - clean, no wrapping/overlap) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Glowing Logo Icon */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-300" />
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center font-black text-sm sm:text-lg text-white shadow-lg shadow-purple-600/30">
                D
              </div>
            </div>

            {/* Title & Metadata */}
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                  DarkMusic <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">Studio</span>
                </span>

                {/* Current Admin Account Badge */}
                {currentProfile && (
                  <div
                    className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] sm:text-xs shadow-sm"
                    title={`Текущий профиль: ${currentProfile.name} • ${currentProfile.role}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full bg-gradient-to-tr ${currentProfile.color} animate-pulse shrink-0`}
                    />
                    <span className="font-bold text-zinc-100">{currentProfile.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">
                      ({currentProfile.role})
                    </span>
                  </div>
                )}
              </div>

              {/* Status and Repo details */}
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">
                {isVerifyingToken ? (
                  <span className="text-zinc-400">Проверка доступа...</span>
                ) : isTokenValid && userProfile ? (
                  <button
                    onClick={onOpenGitHubSync}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                    title="Нажмите для изменения токена или репозитория"
                  >
                    <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400 shrink-0" />
                    <span>@{userProfile.login}</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenGitHubSync}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 transition-colors"
                    title="Нажмите, чтобы ввести токен GitHub и синхронизировать"
                  >
                    <AlertCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold">Ввести токен</span>
                  </button>
                )}

                <span className="text-zinc-600 hidden sm:inline">•</span>

                <button
                  onClick={onOpenGitHubSync}
                  className="hidden sm:flex items-center gap-1 text-zinc-500 hover:text-zinc-300 font-mono text-[10px] transition-colors"
                  title="Текущий репозиторий"
                >
                  <GitBranch className="w-3 h-3 text-zinc-500" />
                  <span>{repo}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Global Actions (Right - clean, focused, no 3-stripes menu) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Media Files Shortcut */}
            <button
              onClick={() => setActiveTab('storage')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700'
              }`}
              title="Открыть медиафайлы репозитория (аудио, обложки, проверка привязки)"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Файлы</span>
            </button>

            {/* Refresh from GitHub */}
            <button
              onClick={() => refreshCatalog()}
              disabled={isLoading}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all disabled:opacity-50"
              title="Синхронизировать данные с GitHub"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            {/* Backup Download JSON */}
            <button
              onClick={downloadJson}
              className="hidden lg:flex p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
              title="Скачать резервную копию catalog.json"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Publish Changes Button */}
            <button
              onClick={onOpenPublishModal}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg whitespace-nowrap shrink-0 ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white shadow-purple-600/40 ring-2 ring-purple-500/40'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
              title="Опубликовать изменения в репозиторий"
            >
              <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Опубликовать</span>
              <span className="sm:hidden">Публикация</span>
              {hasUnsavedChanges ? (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-black/50 text-[10px] sm:text-[11px] font-mono tabular-nums text-emerald-300 font-bold border border-emerald-500/30">
                  {diffs.length}
                  {pendingFiles.length > 0 ? ` +${pendingFiles.length}` : ''}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-500">
                  0
                </span>
              )}
            </button>

            {/* Admin Avatar & Logout (Visible on all screen sizes) */}
            {currentProfile && (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-zinc-800">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr ${currentProfile.color} flex items-center justify-center text-white font-black text-xs shadow-md shrink-0`}
                  title={`${currentProfile.name} • ${currentProfile.role}`}
                >
                  {currentProfile.name[0]}
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
                  title="Сменить профиль / Выйти из сессии"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Single Navigation Bar: Smooth, Centered & Non-Overlapping Tabs */}
      <div className="w-full bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2 no-scrollbar scroll-smooth">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 group ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/50 shadow-md shadow-purple-600/10 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/90 border border-transparent hover:border-zinc-800'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors ${
                        isActive
                          ? 'bg-purple-500/30 text-purple-200 font-bold'
                          : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-400 border border-zinc-800/80'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
