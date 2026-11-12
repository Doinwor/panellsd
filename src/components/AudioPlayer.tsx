import React from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useCatalog } from '../context/CatalogContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ExternalLink,
  Music,
  UploadCloud,
} from 'lucide-react';
import { DEFAULT_REPO, DEFAULT_BRANCH } from '../services/githubApi';
import { resolveMediaUrl } from '../utils/mediaUtils';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    playNextTrack,
    playPrevTrack,
    hasNextTrack,
    hasPrevTrack,
    isCurrentTrackPending,
  } = useAudioPlayer();

  const { catalog, getPendingFileForPath } = useCatalog();

  if (!currentTrack) {
    return null;
  }

  // Find artist display name
  const artist = catalog?.customArtists.find((a) => a.id === currentTrack.artistId);
  const featArtist = currentTrack.featArtistId
    ? catalog?.customArtists.find((a) => a.id === currentTrack.featArtistId)
    : null;
  const album = catalog?.customAlbums.find((alb) => alb.id === currentTrack.albumId);

  // Resolve cover URL with instant fallback to locally staged images
  const rawCover = currentTrack.coverFile || album?.coverFile || '';
  const coverUrl = resolveMediaUrl(rawCover, getPendingFileForPath);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-3 sm:px-6 py-2.5 shadow-2xl transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Track Info with animated mini-equalizer */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 max-w-[170px] sm:max-w-[280px]">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center shadow-inner">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                {currentTrack.title}
              </span>

              {/* 3-bar animated equalizer when playing */}
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3 shrink-0" title="Воспроизводится">
                  <span className="w-0.5 h-full bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-2/3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <span className="w-0.5 h-4/5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              )}

              {currentTrack.isExplicit && (
                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-zinc-800 text-rose-400 border border-rose-500/30 shrink-0">
                  18+
                </span>
              )}

              {isCurrentTrackPending && (
                <span
                  className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 shrink-0"
                  title="Файл прослушивается из локального черновика до выгрузки в GitHub"
                >
                  <UploadCloud className="w-2.5 h-2.5 text-purple-400" />
                  Черновик
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-400 truncate mt-0.5">
              {artist?.name || currentTrack.artistId}
              {featArtist && ` feat. ${featArtist.name}`}
              {album && ` • ${album.title}`}
            </p>
          </div>
        </div>

        {/* Center Controls (Prev, Play/Pause, Next & Scrubber) */}
        <div className="flex-1 max-w-xl flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-3">
            {/* Prev Track */}
            <button
              onClick={playPrevTrack}
              disabled={!hasPrevTrack}
              className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
              title="Предыдущий трек"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/25"
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={playNextTrack}
              disabled={!hasNextTrack}
              className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
              title="Следующий трек"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          <div className="w-full flex items-center gap-1.5 sm:gap-3">
            <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-zinc-400 w-7 sm:w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="relative flex-1 h-1.5 bg-zinc-800 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seek(pos * duration);
              }}
            >
              <div
                className="absolute top-0 left-0 bottom-0 bg-emerald-500 group-hover:bg-emerald-400 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow transition-opacity"
                style={{ left: `calc(${progressPercent}% - 5px)` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-zinc-500 w-7 sm:w-9">
              {duration > 0 ? formatTime(duration) : currentTrack.duration || '0:00'}
            </span>
          </div>
        </div>

        {/* Right Volume & Link */}
        <div className="hidden sm:flex items-center gap-2.5 min-w-[120px] justify-end shrink-0">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
            title={volume === 0 ? 'Включить звук' : 'Выключить звук'}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <a
            href={`https://github.com/${DEFAULT_REPO}/blob/${DEFAULT_BRANCH}/${encodeURI(currentTrack.filePath)}`}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
            title="Открыть файл в GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
