import React, { useState, useEffect, useRef } from 'react';
import { NewsRecord, PendingFileUpload } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { X, Newspaper, Upload, Image as ImageIcon, Trash2, FolderOpen } from 'lucide-react';
import { DEFAULT_REPO, DEFAULT_BRANCH } from '../../services/githubApi';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsToEdit?: NewsRecord | null;
}

export const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  newsToEdit,
}) => {
  const { addNews, updateNews, catalog, addPendingFile, getPendingFileForPath, repoFiles } = useCatalog();

  const [title, setTitle] = useState('');
  const [targetId, setTargetId] = useState('app');
  const [dateText, setDateText] = useState('');
  const [imageFile, setImageFile] = useState('');
  const [imageFileStaged, setImageFileStaged] = useState<PendingFileUpload | null>(null);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (newsToEdit) {
      setTitle(newsToEdit.title || '');
      setTargetId(newsToEdit.targetId || 'app');
      setDateText(newsToEdit.dateText || '');
      setImageFile(newsToEdit.imageFile || '');
      setContent(newsToEdit.content || '');

      const staged = getPendingFileForPath(newsToEdit.imageFile);
      setImageFileStaged(staged || null);
    } else {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yy = String(today.getFullYear()).slice(-2);

      setTitle('');
      setTargetId('app');
      setDateText(`${dd}.${mm}.${yy}`);
      setImageFile('');
      setContent('');
      setImageFileStaged(null);
    }
    setShowRepoPicker(false);
    setError(null);
  }, [newsToEdit, isOpen, getPendingFileForPath]);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'news';
    const targetPath = `covers/news_${cleanTitle}_${Date.now()}.jpg`;
    setImageFile(targetPath);

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] || '';
      const pending: PendingFileUpload = {
        id: `file_news_${Date.now()}`,
        filePath: targetPath,
        file,
        base64Content: b64,
        size: file.size,
        previewUrl,
        category: 'covers',
      };
      setImageFileStaged(pending);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (imageFileStaged?.previewUrl && imageFileStaged.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageFileStaged.previewUrl);
    }
    setImageFile('');
    setImageFileStaged(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Заголовок новости обязателен.');
      return;
    }
    if (!content.trim()) {
      setError('Текст новости обязателен.');
      return;
    }

    if (imageFileStaged) {
      addPendingFile({
        ...imageFileStaged,
        filePath: imageFile.trim(),
      });
    }

    const id = newsToEdit?.id || `news_${Date.now()}`;
    const record: NewsRecord = {
      id,
      title: title.trim(),
      targetId: targetId.trim(),
      dateText: dateText.trim() || '01.01.26',
      imageFile: imageFile.trim(),
      content: content.trim(),
      createdAt: newsToEdit?.createdAt || Date.now(),
    };

    if (newsToEdit) {
      updateNews(newsToEdit.id, record);
    } else {
      addNews(record);
    }

    onClose();
  };

  const existingImages = repoFiles.filter((f) =>
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)
  );

  const previewSource = imageFileStaged?.previewUrl
    ? imageFileStaged.previewUrl
    : imageFile
    ? `https://raw.githubusercontent.com/${DEFAULT_REPO}/${DEFAULT_BRANCH}/${encodeURI(imageFile)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {newsToEdit ? 'Редактировать новость' : 'Создать публикацию в новостной ленте'}
              </h3>
              <p className="text-xs text-zinc-400">Анонсы дропов, концертов и релизов</p>
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
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Заголовок новости *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например: Новый релиз от МС ЕЗДИТЬ"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Привязка (Target)</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="app">Всё приложение (Dark Music)</option>
                {catalog?.customArtists.map((art) => (
                  <option key={art.id} value={art.id}>
                    Артист: {art.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Дата (ДД.ММ.ГГ)</label>
              <input
                type="text"
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                placeholder="02.11.26"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Direct Image File Selection Card */}
          <div className="p-3.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Изображение к новости / баннер</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
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

            {/* Image Preview Banner */}
            {previewSource ? (
              <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 h-36 flex items-center justify-center group">
                <img
                  src={previewSource}
                  alt="Предпросмотр новости"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex items-end justify-between p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="truncate pr-2">
                    <p className="text-[11px] font-mono text-zinc-200 truncate">{imageFile}</p>
                    {imageFileStaged && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Готов к выгрузке ({(imageFileStaged.size / 1024).toFixed(1)} KB)
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
                <p className="text-xs text-zinc-400">Нажмите для выбора баннера новости с устройства</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">JPG, PNG или WEBP (файл загрузится в GitHub автоматически при публикации)</p>
              </div>
            )}

            {/* Repo files picker dropdown */}
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
                          setImageFile(path);
                          setImageFileStaged(null);
                          setShowRepoPicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition-colors flex items-center justify-between ${
                          imageFile === path
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'hover:bg-zinc-900 text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{path}</span>
                        {imageFile === path && <span className="text-[10px] text-amber-400">✓ Выбрано</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Fallback Manual Path input */}
            <div>
              <input
                type="text"
                value={imageFile}
                onChange={(e) => {
                  setImageFile(e.target.value);
                  setImageFileStaged(null);
                }}
                placeholder="Путь в репозитории: covers/news_banner.jpg (или оставьте пустым)"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Текст публикации *</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Опишите релиз, сотрудничество или анонс..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
            />
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
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition-all"
            >
              {newsToEdit ? 'Сохранить новость' : 'Опубликовать новость'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
