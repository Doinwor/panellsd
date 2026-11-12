import React, { useState } from 'react';
import { TrackRecord } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Music,
  Disc,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUtils';
import { ConfirmModal } from '../modals/ConfirmModal';

interface TracksViewProps {
  onOpenAddTrack: () => void;
  onEditTrack: (track: TrackRecord) => void;
}

export const TracksView: React.FC<TracksViewProps> = ({
  onOpenAddTrack,
  onEditTrack,
}) => {
  const { catalog, deleteTrack, reorderTracks, getPendingFileForPath } = useCatalog();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  const [search, setSearch] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('all');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [trackToDelete, setTrackToDelete] = useState<TrackRecord | null>(null);

  if (!catalog) return null;

  const filteredTracks = catalog.customTracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.filePath.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesArtist =
      selectedArtist === 'all' || t.artistId === selectedArtist || t.featArtistId === selectedArtist;
    const matchesAlbum = selectedAlbum === 'all' || t.albumId === selectedAlbum;

    return matchesSearch && matchesArtist && matchesAlbum;
  });

  const handleConfirmDelete = () => {
    if (trackToDelete) {
      deleteTrack(trackToDelete.id);
      setTrackToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span>Аудиотреки</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
              {catalog.customTracks.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Управляйте полным треклистом, привязкой к альбомам, порядком воспроизведения и аудиофайлами
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или файлу..."
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 w-full sm:w-60"
            />
          </div>

          <button
            onClick={onOpenAddTrack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all shrink-0 ml-auto sm:ml-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Добавить трек
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Артист:</span>
          <select
            value={selectedArtist}
            onChange={(e) => {
              setSelectedArtist(e.target.value);
              setSelectedAlbum('all');
            }}
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Релиз:</span>
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">Все релизы</option>
            <option value="">— Синглы без альбома —</option>
            {catalog.customAlbums
              .filter((alb) => selectedArtist === 'all' || alb.artistId === selectedArtist)
              .map((alb) => (
                <option key={alb.id} value={alb.id}>
                  {alb.title} ({alb.year})
                </option>
              ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-zinc-500 font-mono tabular-nums">
          Показано: {filteredTracks.length} из {catalog.customTracks.length}
        </div>
      </div>

      {/* High Density Tracks Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3 w-10 text-center">Play</th>
                <th className="py-3 px-3">Трек</th>
                <th className="py-3 px-3">Исполнитель</th>
                <th className="py-3 px-3">Альбом</th>
                <th className="py-3 px-3">Статус / Файл</th>
                <th className="py-3 px-3 text-right">Время</th>
                <th className="py-3 px-3 text-center">Год</th>
                <th className="py-3 px-3 text-right">Порядок</th>
                <th className="py-3 px-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-xs">
              {filteredTracks.map((trk, index) => {
                const artist = catalog.customArtists.find((a) => a.id === trk.artistId);
                const featArtist = trk.featArtistId
                  ? catalog.customArtists.find((a) => a.id === trk.featArtistId)
                  : null;
                const album = catalog.customAlbums.find((a) => a.id === trk.albumId);

                // Live cover resolution with fallback to staged files
                const rawCover = trk.coverFile || album?.coverFile || '';
                const coverUrl = resolveMediaUrl(rawCover, getPendingFileForPath);
                const isPendingTrack = Boolean(getPendingFileForPath(trk.filePath));

                const isCurrent = currentTrack?.id === trk.id;

                return (
                  <tr
                    key={trk.id}
                    className={`hover:bg-zinc-800/40 transition-colors group ${
                      isCurrent ? 'bg-purple-950/25 ring-1 ring-inset ring-purple-500/20' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-zinc-500">
                      {index + 1}
                    </td>

                    {/* Play Button */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (isCurrent) {
                            togglePlay();
                          } else {
                            playTrack(trk, undefined, filteredTracks);
                          }
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                          isCurrent && isPlaying
                            ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                        title={isCurrent && isPlaying ? 'Пауза' : 'Воспроизвести'}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </td>

                    {/* Track Title & Badges */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={trk.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-semibold ${
                                isCurrent ? 'text-emerald-400 font-bold' : 'text-zinc-100'
                              }`}
                            >
                              {trk.title}
                            </span>

                            {/* Animated 3-bar equalizer when active and playing */}
                            {isCurrent && isPlaying && (
                              <div className="flex items-end gap-[2px] h-3 shrink-0" title="Воспроизводится сейчас">
                                <span className="w-0.5 h-full bg-emerald-400 rounded-full animate-pulse" />
                                <span className="w-0.5 h-2/3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                                <span className="w-0.5 h-4/5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                              </div>
                            )}

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
                            {isPendingTrack && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60">
                                <UploadCloud className="w-2.5 h-2.5 text-purple-400" />
                                В черновике
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 block truncate max-w-[200px]">
                            {trk.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Artist */}
                    <td className="py-2.5 px-3">
                      <span className="text-zinc-200 font-medium">{artist?.name || trk.artistId}</span>
                      {featArtist && (
                        <span className="text-zinc-400 text-[11px] block truncate">
                          feat. {featArtist.name}
                        </span>
                      )}
                    </td>

                    {/* Album */}
                    <td className="py-2.5 px-3">
                      {album ? (
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Disc className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[150px]">{album.title}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-[11px] italic">Сингл</span>
                      )}
                    </td>

                    {/* File Path & Upload Status */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {isPendingTrack ? (
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" title="Ожидает выгрузки в GitHub" />
                        ) : (
                          <span title="Опубликован в GitHub">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500/70 shrink-0" />
                          </span>
                        )}
                        <span
                          className="text-[11px] font-mono text-zinc-400 truncate block max-w-[200px]"
                          title={trk.filePath}
                        >
                          {trk.filePath}
                        </span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-300">
                      {trk.duration}
                    </td>

                    {/* Year */}
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-400">
                      {trk.year}
                    </td>

                    {/* Order buttons */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => reorderTracks(trk.id, 'up', filteredTracks[index - 1]?.id)}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-colors"
                          title="Поднять выше"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => reorderTracks(trk.id, 'down', filteredTracks[index + 1]?.id)}
                          disabled={index === filteredTracks.length - 1}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-colors"
                          title="Опустить ниже"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onEditTrack(trk)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                          title="Редактировать трек"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTrackToDelete(trk)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Удалить трек"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Styled Confirmation Modal for deleting tracks */}
      <ConfirmModal
        isOpen={Boolean(trackToDelete)}
        title="Удаление трека из каталога"
        message={`Вы уверены, что хотите удалить трек «${trackToDelete?.title}»? Изменение добавится в черновик и применится к репозиторию после публикации.`}
        confirmLabel="Удалить трек"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTrackToDelete(null)}
      />
    </div>
  );
};
