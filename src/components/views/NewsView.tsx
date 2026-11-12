import React, { useState } from 'react';
import { NewsRecord } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { Plus, Edit2, Trash2, Calendar, Newspaper, User, UploadCloud } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUtils';
import { ConfirmModal } from '../modals/ConfirmModal';

interface NewsViewProps {
  onOpenAddNews: () => void;
  onEditNews: (news: NewsRecord) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  onOpenAddNews,
  onEditNews,
}) => {
  const { catalog, deleteNews, getPendingFileForPath } = useCatalog();
  const [newsToDelete, setNewsToDelete] = useState<NewsRecord | null>(null);

  if (!catalog) return null;

  const handleConfirmDelete = () => {
    if (newsToDelete) {
      deleteNews(newsToDelete.id);
      setNewsToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span>Новости и Релизы</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
              {catalog.customNews.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Анонсы новых дропов, концертов и новостей лейбла в мобильном приложении
          </p>
        </div>

        <button
          onClick={onOpenAddNews}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 transition-all shrink-0 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Добавить новость
        </button>
      </div>

      {/* News Cards */}
      <div className="space-y-4">
        {catalog.customNews.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center text-zinc-500 text-xs backdrop-blur-md">
            Новостей пока нет. Нажмите «Добавить новость», чтобы опубликовать первый анонс.
          </div>
        ) : (
          catalog.customNews.map((news) => {
            const targetArtist =
              news.targetId !== 'app'
                ? catalog.customArtists.find((a) => a.id === news.targetId)
                : null;

            const imageUrl = news.imageFile ? resolveMediaUrl(news.imageFile, getPendingFileForPath) : '';
            const isImagePending = Boolean(getPendingFileForPath(news.imageFile));

            return (
              <div
                key={news.id}
                className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg hover:border-zinc-700 transition-colors flex flex-col md:flex-row gap-5 backdrop-blur-md"
              >
                {imageUrl && (
                  <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                    <img
                      src={imageUrl}
                      alt={news.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {isImagePending && (
                      <span className="absolute top-2 left-2 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-950/90 text-purple-200 border border-purple-800/60 backdrop-blur-md flex items-center gap-1">
                        <UploadCloud className="w-2.5 h-2.5 text-purple-400" />
                        Черновик
                      </span>
                    )}
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {news.targetId === 'app' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                            <Newspaper className="w-3 h-3" />
                            Dark Music (Общее)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {targetArtist?.name || news.targetId}
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          {news.dateText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditNews(news)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                          title="Редактировать новость"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setNewsToDelete(news)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Удалить новость"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-zinc-100 mb-2">{news.title}</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                      {news.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-600">
                    ID: {news.id}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Styled Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(newsToDelete)}
        title="Удаление новости"
        message={`Удалить новость «${newsToDelete?.title}»?`}
        confirmLabel="Удалить новость"
        onConfirm={handleConfirmDelete}
        onCancel={() => setNewsToDelete(null)}
      />
    </div>
  );
};
