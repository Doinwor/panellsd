import React, { useState } from 'react';
import { ArtistRecord } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { Plus, Edit2, Trash2, Search, Sparkles, User, Disc, Music, UploadCloud } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUtils';
import { ConfirmModal } from '../modals/ConfirmModal';

interface ArtistsViewProps {
  onOpenAddArtist: () => void;
  onEditArtist: (artist: ArtistRecord) => void;
}

export const ArtistsView: React.FC<ArtistsViewProps> = ({
  onOpenAddArtist,
  onEditArtist,
}) => {
  const { catalog, deleteArtist, getPendingFileForPath } = useCatalog();
  const [search, setSearch] = useState('');
  const [artistToDelete, setArtistToDelete] = useState<ArtistRecord | null>(null);

  if (!catalog) return null;

  const filteredArtists = catalog.customArtists.filter(
    (art) =>
      art.name.toLowerCase().includes(search.toLowerCase()) ||
      art.id.toLowerCase().includes(search.toLowerCase()) ||
      art.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmDelete = () => {
    if (artistToDelete) {
      deleteArtist(artistToDelete.id);
      setArtistToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span>Артисты лейбла</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
              {catalog.customArtists.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Редактируйте профили исполнителей, биографии, интересные факты и визуальные темы
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск артиста..."
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={onOpenAddArtist}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Добавить артиста
          </button>
        </div>
      </div>

      {/* Grid of Artist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArtists.map((art) => {
          const avatarUrl = resolveMediaUrl(art.avatarFile || `avatars/${art.id}.jpg`, getPendingFileForPath);
          const bannerUrl = art.bannerFile ? resolveMediaUrl(art.bannerFile, getPendingFileForPath) : '';

          const isAvatarPending = Boolean(getPendingFileForPath(art.avatarFile));

          const artistTracks = catalog.customTracks.filter(
            (t) => t.artistId === art.id || t.featArtistId === art.id
          );
          const artistAlbums = catalog.customAlbums.filter((a) => a.artistId === art.id);

          return (
            <div
              key={art.id}
              className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl hover:border-zinc-700 transition-all flex flex-col group backdrop-blur-md"
            >
              {/* Banner Area */}
              <div className="relative h-28 bg-gradient-to-r from-zinc-900 to-zinc-800 overflow-hidden">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt={`${art.name} banner`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-r ${art.gradient || 'from-purple-900 to-indigo-900'} opacity-70`} />
                )}

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <button
                    onClick={() => onEditArtist(art)}
                    className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md hover:bg-black/90 text-white border border-white/10 transition-colors"
                    title="Редактировать артиста"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setArtistToDelete(art)}
                    className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md hover:bg-rose-950 text-rose-400 border border-white/10 transition-colors"
                    title="Удалить артиста"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Avatar & Main Content */}
              <div className="px-5 pb-5 pt-0 relative flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-end justify-between -mt-10 mb-3">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 shadow-xl shrink-0 group-hover:border-purple-500/50 transition-colors">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={art.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      {isAvatarPending && (
                        <div className="absolute bottom-0 inset-x-0 bg-purple-950/90 text-[8px] font-mono text-purple-200 text-center py-0.5">
                          Черновик
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800/90 text-purple-300 border border-purple-500/30">
                        {art.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 group-hover:text-purple-300 transition-colors">
                      <span>{art.name}</span>
                      <i className={`fa-solid ${art.icon} text-xs text-zinc-500`} />
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-500">ID: {art.id}</p>
                    {art.bio && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
                        {art.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Counters */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-indigo-400" />
                      <b>{artistTracks.length}</b> треков
                    </span>
                    <span className="flex items-center gap-1">
                      <Disc className="w-3.5 h-3.5 text-emerald-400" />
                      <b>{artistAlbums.length}</b> релизов
                    </span>
                  </div>

                  {art.facts && art.facts.length > 0 && art.facts[0] && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {art.facts.length} факт.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Styled Confirmation Modal for deleting artists */}
      <ConfirmModal
        isOpen={Boolean(artistToDelete)}
        title="Удаление артиста"
        message={`Вы уверены, что хотите удалить профиль артиста «${artistToDelete?.name}» (${artistToDelete?.id})? Связанные с ним треки и альбомы останутся в каталоге.`}
        confirmLabel="Удалить артиста"
        onConfirm={handleConfirmDelete}
        onCancel={() => setArtistToDelete(null)}
      />
    </div>
  );
};
