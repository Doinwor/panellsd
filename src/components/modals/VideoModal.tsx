import React, { useState, useEffect, useRef } from 'react';
import { VideoRecord, PendingFileUpload } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { X, Video, Upload, Image as ImageIcon, Trash2, FolderOpen } from 'lucide-react';
import { DEFAULT_REPO, DEFAULT_BRANCH } from '../../services/githubApi';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoToEdit?: VideoRecord | null;
}

function normalizeVideoSource(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('<iframe')) {
    return trimmed;
  }

  // Check for youtube URL format
  let videoId = '';
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    videoId = ytMatch[1];
  }

  if (videoId) {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }

  return trimmed;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoToEdit,
}) => {
  const { addVideo, updateVideo, catalog, addPendingFile, getPendingFileForPath, repoFiles } = useCatalog();

  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [featArtistId, setFeatArtistId] = useState('');
  const [year, setYear] = useState<number>(2026);
  const [previewFile, setPreviewFile] = useState('');
  const [previewFileStaged, setPreviewFileStaged] = useState<PendingFileUpload | null>(null);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [videoSource, setVideoSource] = useState('');
  const [duration, setDuration] = useState('2:30');
  const [isExplicit, setIsExplicit] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (videoToEdit) {
      setTitle(videoToEdit.title || '');
      setArtistId(videoToEdit.artistId || catalog?.customArtists[0]?.id || '');
      setFeatArtistId(videoToEdit.featArtistId || '');
      setYear(videoToEdit.year || 2026);
      setPreviewFile(videoToEdit.previewFile || '');
      setVideoSource(videoToEdit.videoSource || '');
      setDuration(videoToEdit.duration || '2:30');
      setIsExplicit(videoToEdit.isExplicit ?? true);

      const staged = getPendingFileForPath(videoToEdit.previewFile);
      setPreviewFileStaged(staged || null);
    } else {
      setTitle('');
      setArtistId(catalog?.customArtists[0]?.id || 'mc_makaka');
      setFeatArtistId('');
      setYear(2026);
      setPreviewFile('');
      setVideoSource('');
      setDuration('2:30');
      setIsExplicit(true);
      setPreviewFileStaged(null);
    }
    setShowRepoPicker(false);
    setError(null);
  }, [videoToEdit, isOpen, catalog, getPendingFileForPath]);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'clip';
    const targetPath = `covers/clip_${cleanTitle}_${Date.now()}.jpg`;
    setPreviewFile(targetPath);

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] || '';
      const pending: PendingFileUpload = {
        id: `file_clip_${Date.now()}`,
        filePath: targetPath,
        file,
        base64Content: b64,
        size: file.size,
        previewUrl,
        category: 'covers',
      };
      setPreviewFileStaged(pending);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (previewFileStaged?.previewUrl && previewFileStaged.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewFileStaged.previewUrl);
    }
    setPreviewFile('');
    setPreviewFileStaged(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Название клипа обязательно.');
      return;
    }
    if (!videoSource.trim()) {
      setError('Укажите код встраивания iframe или ссылку на YouTube.');
      return;
    }

    if (previewFileStaged) {
      addPendingFile({
        ...previewFileStaged,
        filePath: previewFile.trim(),
      });
    }

    const normalizedIframe = normalizeVideoSource(videoSource);
    const id = videoToEdit?.id || `vid_${Date.now()}`;
    const record: VideoRecord = {
      id,
      title: title.trim(),
      artistId: artistId.trim(),
      featArtistId: featArtistId.trim() || undefined,
      videoSource: normalizedIframe,
      previewFile: previewFile.trim(),
      duration: duration.trim() || '2:30',
      year: Number(year) || 2026,
      isExplicit: Boolean(isExplicit),
      createdAt: videoToEdit?.createdAt || Date.now(),
    };

    if (videoToEdit) {
      updateVideo(videoToEdit.id, record);
    } else {
      addVideo(record);
    }

    onClose();
  };

  const existingImages = repoFiles.filter((f) =>
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)
  );

  const previewSource = previewFileStaged?.previewUrl
    ? previewFileStaged.previewUrl
    : previewFile
    ? `https://raw.githubusercontent.com/${DEFAULT_REPO}/${DEFAULT_BRANCH}/${encodeURI(previewFile)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {videoToEdit ? 'Редактировать клип' : 'Добавить новый музыкальный клип'}
              </h3>
              <p className="text-xs text-zinc-400">YouTube видеоплеер и обложка видео</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Название клипа *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например: Волшебная бутылочка"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Исполнитель *</label>
              <select
                required
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                {catalog?.customArtists.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.name} ({art.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Совместно с (feat.)</label>
              <select
                value={featArtistId}
                onChange={(e) => setFeatArtistId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">— Без фита —</option>
                {catalog?.customArtists
                  .filter((art) => art.id !== artistId)
                  .map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.name} ({art.id})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* YouTube Video Source */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Ссылка на YouTube или HTML iframe *
            </label>
            <textarea
              rows={3}
              required
              value={videoSource}
              onChange={(e) => setVideoSource(e.target.value)}
              placeholder="Вставьте ссылку https://www.youtube.com/watch?v=... или <iframe>...</iframe>"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono resize-none"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Ссылка будет автоматически преобразована в адаптивный плеер.
            </p>
          </div>

          {/* Direct Preview Image Selection Card */}
          <div className="p-3.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                <span>Обложка клипа (превью)</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Выбрать файл</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRepoPicker(!showRepoPicker)}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Выбрать из существующих в репозитории"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Из репозитория</span>
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {previewSource ? (
              <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 h-36 flex items-center justify-center group">
                <img
                  src={previewSource}
                  alt="Предпросмотр клипа"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex items-end justify-between p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="truncate pr-2">
                    <p className="text-[11px] font-mono text-zinc-200 truncate">{previewFile}</p>
                    {previewFileStaged && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Готов к выгрузке ({(previewFileStaged.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 transition-colors shrink-0"
                    title="Удалить обложку"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-5 px-4 text-center cursor-pointer rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-800/40 transition-colors"
              >
                <ImageIcon className="w-7 h-7 text-zinc-600 mx-auto mb-1.5" />
                <p className="text-xs text-zinc-400">Нажмите для выбора обложки клипа с устройства</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">JPG, PNG или WEBP (автоматически загрузится при публикации)</p>
              </div>
            )}

            {showRepoPicker && (
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Выберите изображение из репозитория:</span>
                  <button
                    type="button"
                    onClick={() => setShowRepoPicker(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {existingImages.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 py-2 text-center">Изображения не найдены в репозитории</p>
                  ) : (
                    existingImages.map((path) => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => {
                          setPreviewFile(path);
                          setPreviewFileStaged(null);
                          setShowRepoPicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition-colors flex items-center justify-between ${
                          previewFile === path
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'hover:bg-zinc-900 text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{path}</span>
                        {previewFile === path && <span className="text-[10px] text-rose-400">✓ Выбрано</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div>
              <input
                type="text"
                value={previewFile}
                onChange={(e) => {
                  setPreviewFile(e.target.value);
                  setPreviewFileStaged(null);
                }}
                placeholder="Путь в репозитории: covers/clip_mcmakaka.jpg"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Длительность (ММ:СС)</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="2:23"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Год выпуска</label>
              <input
                type="number"
                min={2000}
                max={2035}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExplicit}
                onChange={(e) => setIsExplicit(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-rose-500 focus:ring-0"
              />
              <span className="text-xs font-medium text-zinc-200">Метка 18+ (Explicit)</span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all"
            >
              {videoToEdit ? 'Сохранить клип' : 'Добавить клип'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
