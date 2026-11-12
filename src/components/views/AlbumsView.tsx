import React, { useState } from 'react';
import { AlbumRecord, TrackRecord } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Disc,
  Music,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  UploadCloud,
} from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUtils';
import { ConfirmModal } from '../modals/ConfirmModal';

interface AlbumsViewProps {
  onOpenAddAlbum: () => void;
  onEditAlbum: (album: AlbumRecord) => void;
  onSelectAlbumFilter?: (albumId: string) => void;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  onOpenAddAlbum,
  onEditAlbum,
}) => {
  const { catalog, deleteAlbum, getPendingFileForPath } = useCatalog();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArtist, setSelectedArtist] = useState<string>('all');
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<AlbumRecord | null>(null);

  if (!catalog) return null;

  const filteredAlbums = catalog.customAlbums.filter((alb) => {
    const matchesSearch =
      alb.title.toLowerCase().includes(search.toLowerCase()) ||
      alb.id.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || alb.type === selectedType;
    const matchesArtist =
      selectedArtist === 'all' || alb.artistId === selectedArtist || alb.featArtistId === selectedArtist;
    return matchesSearch && matchesType && matchesArtist;
  });

  const handleConfirmDelete = () => {
    if (albumToDelete) {
      deleteAlbum(albumToDelete.id);
      setAlbumToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span>Альбомы и Синглы</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
              {catalog.customAlbums.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Каталог полноформатных релизов, EP и синглов с интерактивными треклистами и предпросмотром
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по релизу..."
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 w-40 sm:w-56"
            />
          </div>

          <button
            onClick={onOpenAddAlbum}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Создать релиз
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-md">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {(['all', 'АЛЬБОМ', 'СИНГЛ', 'EP'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                selectedType === t
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t === 'all' ? 'Все типы' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-zinc-500">Артист:</span>
          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">Все артисты</option>
            {catalog.customArtists.map((art) => (
              <option key={art.id} value={art.id}>
                {art.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Releases Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredAlbums.map((alb) => {
          const artist = catalog.customArtists.find((a) => a.id === alb.artistId);
          const featArtist = alb.featArtistId
            ? catalog.customArtists.find((a) => a.id === alb.featArtistId)
            : null;

          // Instant local or remote cover URL resolution
          const coverUrl = resolveMediaUrl(alb.coverFile, getPendingFileForPath);
          const isCoverPending = Boolean(getPendingFileForPath(alb.coverFile));

          const albumTracks = catalog.customTracks.filter((t) => t.albumId === alb.id);
          const isExpanded = expandedAlbumId === alb.id;

          return (
            <div
              key={alb.id}
              className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl hover:border-zinc-700 transition-all flex flex-col group backdrop-blur-md"
            >
              {/* Cover Aspect Square */}
              <div className="relative aspect-square bg-zinc-950 overflow-hidden">
                <img
                  src={coverUrl}
                  alt={alb.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 -z-10">
                  <Disc className="w-12 h-12 text-zinc-800" />
                </div>

                {/* Overlaid Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-emerald-300 uppercase">
                    {alb.type}
                  </span>
                  {alb.isExplicit && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-rose-500/30 text-rose-400">
                      18+
                    </span>
                  )}
                  {isCoverPending && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 backdrop-blur-md">
                      Черновик
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => onEditAlbum(alb)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 text-white border border-white/10 transition-colors"
                    title="Редактировать релиз"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAlbumToDelete(alb)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md hover:bg-rose-950 text-rose-400 border border-white/10 transition-colors"
                    title="Удалить релиз"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300">
                    {alb.year}
                  </span>
                </div>
              </div>

              {/* Release Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                    {alb.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {artist?.name || alb.artistId}
                    {featArtist && ` feat. ${featArtist.name}`}
                  </p>
                </div>

                {/* Tracklist Toggle Bar */}
                <div className="mt-3 pt-3 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setExpandedAlbumId(isExpanded ? null : alb.id)}
                      className="flex items-center gap-1.5 font-semibold text-zinc-300 hover:text-emerald-400 transition-colors"
                    >
                      <Music className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{albumTracks.length} треков</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[100px]">
                      {alb.id}
                    </span>
                  </div>

                  {/* Expandable Tracklist Accordion */}
                  {isExpanded && (
                    <div className="mt-3 pt-2 border-t border-zinc-800/80 space-y-1.5 max-h-48 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-150">
                      {albumTracks.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 italic py-1 text-center">
                          В релизе пока нет треков
                        </p>
                      ) : (
                        albumTracks.map((t, idx) => {
                          const isTrkPlaying = currentTrack?.id === t.id && isPlaying;
                          return (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/60 border border-zinc-800/60 text-xs transition-colors group/trk"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentTrack?.id === t.id) {
                                      togglePlay();
                                    } else {
                                      playTrack(t, undefined, albumTracks);
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                                    isTrkPlaying
                                      ? 'bg-emerald-500 text-zinc-950'
                                      : 'bg-zinc-800 group-hover/trk:bg-emerald-500/20 text-zinc-300'
                                  }`}
                                >
                                  {isTrkPlaying ? (
                                    <Pause className="w-3 h-3 fill-current" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                  )}
                                </button>
                                <span className="font-mono text-[10px] text-zinc-500">{idx + 1}.</span>
                                <span className={`truncate text-[11px] ${isTrkPlaying ? 'text-emerald-400 font-bold' : 'text-zinc-200'}`}>
                                  {t.title}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 tabular-nums shrink-0 ml-1">
                                {t.duration}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Styled Confirmation Modal for deleting albums */}
      <ConfirmModal
        isOpen={Boolean(albumToDelete)}
        title="Удаление релиза"
        message={`Удалить релиз «${albumToDelete?.title}» (${albumToDelete?.id})? Все входящие в него треки останутся в каталоге в виде отдельных синглов.`}
        confirmLabel="Удалить релиз"
        onConfirm={handleConfirmDelete}
        onCancel={() => setAlbumToDelete(null)}
      />
    </div>
  );
};
