import React, { useState } from 'react';
import { VideoRecord } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { Plus, Edit2, Trash2, Search, Video as VideoIcon, Play } from 'lucide-react';
import { DEFAULT_REPO, DEFAULT_BRANCH } from '../../services/githubApi';

interface VideosViewProps {
  onOpenAddVideo: () => void;
  onEditVideo: (video: VideoRecord) => void;
}

export const VideosView: React.FC<VideosViewProps> = ({
  onOpenAddVideo,
  onEditVideo,
}) => {
  const { catalog, deleteVideo } = useCatalog();
  const [search, setSearch] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  if (!catalog) return null;

  const filteredVideos = catalog.customVideos.filter((v) => {
    return (
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.artistId.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleDelete = (v: VideoRecord) => {
    if (window.confirm(`Удалить клип «${v.title}» (${v.id})?`)) {
      deleteVideo(v.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span>Видеоклипы</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
              {catalog.customVideos.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Официальные клипы исполнителей, встраиваемые плееры YouTube и превью
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск клипа..."
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 w-40 sm:w-56"
            />
          </div>

          <button
            onClick={onOpenAddVideo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Добавить клип
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.map((vid) => {
          const artist = catalog.customArtists.find((a) => a.id === vid.artistId);
          const featArtist = vid.featArtistId
            ? catalog.customArtists.find((a) => a.id === vid.featArtistId)
            : null;

          const previewUrl = `https://raw.githubusercontent.com/${DEFAULT_REPO}/${DEFAULT_BRANCH}/${encodeURI(
            vid.previewFile
          )}`;

          const isPlayingEmbed = playingVideoId === vid.id;

          return (
            <div
              key={vid.id}
              className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl hover:border-zinc-700 transition-all flex flex-col group"
            >
              {/* Media Container 16:9 */}
              <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                {isPlayingEmbed ? (
                  <div
                    className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                    dangerouslySetInnerHTML={{ __html: vid.videoSource }}
                  />
                ) : (
                  <>
                    <img
                      src={previewUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                      <button
                        onClick={() => setPlayingVideoId(vid.id)}
                        className="w-12 h-12 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform hover:scale-110"
                        title="Запустить просмотр клипа"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-rose-300">
                    {vid.duration}
                  </span>
                  {vid.isExplicit && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-rose-500/30 text-rose-400">
                      18+
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <button
                    onClick={() => onEditVideo(vid)}
                    className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md hover:bg-black text-white border border-white/10 transition-colors"
                    title="Редактировать клип"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(vid)}
                    className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md hover:bg-rose-950 text-rose-400 border border-white/10 transition-colors"
                    title="Удалить клип"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 group-hover:text-rose-400 transition-colors truncate">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {artist?.name || vid.artistId}
                    {featArtist && ` feat. ${featArtist.name}`}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1 font-mono">
                    <VideoIcon className="w-3.5 h-3.5 text-zinc-600" />
                    {vid.year} год
                  </span>
                  <span className="font-mono text-[11px] text-zinc-600 truncate max-w-[140px]">
                    {vid.id}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
