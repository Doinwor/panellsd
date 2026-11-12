import React from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { Users, Disc, Music, Video, Newspaper, Radio, Play, Plus, UploadCloud, Sparkles } from 'lucide-react';
import { DEFAULT_REPO, DEFAULT_BRANCH } from '../../services/githubApi';
import { useAuth, getTimeGreeting } from '../../context/AuthContext';

interface OverviewViewProps {
  setActiveTab: (tab: string) => void;
  onOpenArtistModal: () => void;
  onOpenAlbumModal: () => void;
  onOpenTrackModal: () => void;
  onOpenPublishModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  setActiveTab,
  onOpenArtistModal,
  onOpenAlbumModal,
  onOpenTrackModal,
  onOpenPublishModal,
}) => {
  const { catalog, diffs, hasUnsavedChanges, userProfile, repo } = useCatalog();
  const { currentProfile } = useAuth();
  const { playTrack } = useAudioPlayer();

  if (!catalog) return null;

  const stats = [
    {
      title: 'Артисты лейбла',
      count: catalog.customArtists.length,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      tab: 'artists',
    },
    {
      title: 'Альбомы и Синглы',
      count: catalog.customAlbums.length,
      icon: Disc,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'albums',
    },
    {
      title: 'Аудиотреки',
      count: catalog.customTracks.length,
      icon: Music,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      tab: 'tracks',
    },
    {
      title: 'Видеоклипы',
      count: catalog.customVideos.length,
      icon: Video,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      tab: 'videos',
    },
    {
      title: 'Новости лейбла',
      count: catalog.customNews.length,
      icon: Newspaper,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      tab: 'news',
    },
  ];

  const recentTracks = catalog.customTracks.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-zinc-900/90 to-indigo-950/60 border border-purple-500/20 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-inner">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>Панель управления Dark Music</span>
            </div>
            {currentProfile && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentProfile.badge}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            {currentProfile ? getTimeGreeting(currentProfile.name) : 'Студия управления каталогом релизов'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Добро пожаловать в административную студию лейбла. Редактируйте профили исполнителей, создавайте альбомы и синглы, добавляйте новые .mp3 треки,
            управляйте видеоклипами и новостями. Все изменения публикуются напрямую в репозиторий GitHub.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={onOpenTrackModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Добавить трек
            </button>
            <button
              onClick={onOpenAlbumModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Создать релиз
            </button>
            <button
              onClick={onOpenArtistModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Новый артист
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={onOpenPublishModal}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 ml-auto"
              >
                <UploadCloud className="w-4 h-4" />
                Опубликовать изменения ({diffs.length})
              </button>
            )}
          </div>
        </div>

        {/* Decorative background ambient glows */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-600/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              onClick={() => setActiveTab(s.tab)}
              className="p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 hover:border-purple-500/40 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/10 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {s.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.bgColor} shadow-inner`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <div className="text-2xl font-black font-mono tabular-nums text-white">
                {s.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Two Columns: Recent Tracks & Quick Artists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tracks List (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Последние треки в каталоге</h3>
              <p className="text-xs text-zinc-400">Нажмите Play для предпрослушивания</p>
            </div>
            <button
              onClick={() => setActiveTab('tracks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Все треки ({catalog.customTracks.length}) →
            </button>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {recentTracks.map((trk) => {
              const artist = catalog.customArtists.find((a) => a.id === trk.artistId);
              return (
                <div
                  key={trk.id}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-zinc-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => playTrack(trk)}
                      className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-emerald-500 text-zinc-300 group-hover:text-zinc-950 flex items-center justify-center transition-colors shrink-0"
                      title="Слушать трек"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-100 truncate">{trk.title}</span>
                        {trk.isExplicit && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-zinc-800 text-rose-400 border border-rose-500/20">
                            18+
                          </span>
                        )}
                        {trk.isNew && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {artist?.name || trk.artistId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-xs font-mono tabular-nums text-zinc-400">{trk.duration}</span>
                    <span className="text-xs font-mono text-zinc-500">{trk.year}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Artists Roster (1 col) */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100">Резиденты объединения</h3>
            <button
              onClick={() => setActiveTab('artists')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              Управление →
            </button>
          </div>

          <div className="space-y-3">
            {catalog.customArtists.map((art) => {
              const avatarUrl = `https://raw.githubusercontent.com/${DEFAULT_REPO}/${DEFAULT_BRANCH}/${encodeURI(
                art.avatarFile || `avatars/${art.id}.jpg`
              )}`;

              const artistTracksCount = catalog.customTracks.filter(
                (t) => t.artistId === art.id || t.featArtistId === art.id
              ).length;

              return (
                <div
                  key={art.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                      <img
                        src={avatarUrl}
                        alt={art.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100 truncate">{art.name}</span>
                        <i className={`fa-solid ${art.icon} text-[10px] text-zinc-500`} />
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">{art.role}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                    {artistTracksCount} треков
                  </span>
                </div>
              );
            })}
          </div>

          {/* GitHub Connection Box */}
          <div className="pt-2 border-t border-zinc-800/60">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span>GitHub Репозиторий:</span>
                <span className="font-mono text-zinc-200">{repo}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Подключённый аккаунт:</span>
                <span className="font-mono text-emerald-400">
                  {userProfile ? `@${userProfile.login}` : 'Вход выполнен'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
