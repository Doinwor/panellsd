import React, { useState, useEffect, useRef } from 'react';
import { AlbumRecord, PendingFileUpload } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { X, Disc, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface AlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumToEdit?: AlbumRecord | null;
}

const GRADIENT_PRESETS = [
  { label: 'Emerald / Teal', value: 'from-emerald-600 via-teal-900 to-zinc-950' },
  { label: 'Rose / Red', value: 'from-rose-600 via-red-900 to-zinc-950' },
  { label: 'Sky / Blue', value: 'from-sky-600 via-blue-950 to-zinc-950' },
  { label: 'Amber / Orange', value: 'from-amber-600 via-orange-950 to-zinc-950' },
  { label: 'Purple / Violet', value: 'from-purple-600 via-indigo-900 to-zinc-950' },
];

export const AlbumModal: React.FC<AlbumModalProps> = ({
  isOpen,
  onClose,
  albumToEdit,
}) => {
  const { catalog, addAlbum, updateAlbum, repoFiles, addPendingFile, getPendingFileForPath } = useCatalog();

  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [featArtistId, setFeatArtistId] = useState('');
  const [type, setType] = useState('АЛЬБОМ');
  const [year, setYear] = useState<number>(2026);
  const [coverFile, setCoverFile] = useState('');
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].value);
  const [isExplicit, setIsExplicit] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coverFileStaged, setCoverFileStaged] = useState<PendingFileUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (albumToEdit) {
      setTitle(albumToEdit.title || '');
      setArtistId(albumToEdit.artistId || catalog?.customArtists[0]?.id || '');
      setFeatArtistId(albumToEdit.featArtistId || '');
      setType(albumToEdit.type || 'АЛЬБОМ');
      setYear(albumToEdit.year || 2026);
      setCoverFile(albumToEdit.coverFile || '');
      setGradient(albumToEdit.gradient || GRADIENT_PRESETS[0].value);
      setIsExplicit(albumToEdit.isExplicit ?? true);

      const staged = getPendingFileForPath(albumToEdit.coverFile);
      setCoverFileStaged(staged || null);
    } else {
      setTitle('');
      setArtistId(catalog?.customArtists[0]?.id || 'mc_ezdit');
      setFeatArtistId('');
      setType('АЛЬБОМ');
      setYear(2026);
      setCoverFile('');
      setGradient(GRADIENT_PRESETS[0].value);
      setIsExplicit(true);
      setCoverFileStaged(null);
    }
    setError(null);
  }, [albumToEdit, isOpen, catalog, getPendingFileForPath]);

  if (!isOpen) return null;

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'release';
    const targetPath = `covers/alb_${cleanTitle}_${Date.now()}.jpg`;
    setCoverFile(targetPath);

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] || '';
      const pending: PendingFileUpload = {
        id: `file_alb_${Date.now()}`,
        filePath: targetPath,
        file,
        base64Content: b64,
        size: file.size,
        previewUrl,
        category: 'covers',
      };
      setCoverFileStaged(pending);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Название релиза обязательно.');
      return;
    }
    if (!artistId.trim()) {
      setError('Выберите артиста.');
      return;
    }
    if (!coverFile.trim()) {
      setError('Укажите или загрузите обложку.');
      return;
    }

    if (coverFileStaged) {
      addPendingFile({
        ...coverFileStaged,
        filePath: coverFile.trim(),
      });
    }

    const id = albumToEdit?.id || `alb_${Date.now()}`;
    const record: AlbumRecord = {
      id,
      title: title.trim(),
      artistId: artistId.trim(),
      featArtistId: featArtistId.trim() || undefined,
      type: type.trim() || 'АЛЬБОМ',
      year: Number(year) || 2026,
      coverFile: coverFile.trim(),
      gradient,
      isExplicit: Boolean(isExplicit),
    };

    if (albumToEdit) {
      updateAlbum(albumToEdit.id, record);
    } else {
      addAlbum(record);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {albumToEdit ? 'Редактировать релиз' : 'Создать новый альбом / сингл'}
              </h3>
              <p className="text-xs text-zinc-400">
                Загрузите обложку прямо здесь — она автоматически добавится в GitHub при публикации
              </p>
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
          {/* Direct Cover Selection Card */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Файл обложки релиза</span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{coverFileStaged ? 'Заменить файл' : 'Выбрать обложку с устройства'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
            </div>

            {coverFileStaged ? (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900 border border-emerald-500/30">
                <img
                  src={coverFileStaged.previewUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
                />
                <div className="truncate text-xs">
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Файл выбран и готов к загрузке</span>
                  </div>
                  <span className="text-zinc-300 truncate block mt-0.5">
                    {coverFileStaged.file.name} ({(coverFileStaged.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Нажмите «Выбрать обложку с устройства» — картинка прикрепится к коммиту и загрузится в GitHub вместе со всеми изменениями.
              </p>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Путь к файлу обложки (coverFile):
              </label>
              <input
                type="text"
                required
                value={coverFile}
                onChange={(e) => setCoverFile(e.target.value)}
                placeholder="covers/alb_title.jpg"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />

              {repoFiles.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setCoverFile(e.target.value);
                      setCoverFileStaged(null);
                    }
                  }}
                  className="mt-1 w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 font-mono"
                >
                  <option value="">-- Или выбрать уже существующую обложку в GitHub --</option>
                  {repoFiles
                    .filter((f) => f.startsWith('covers/'))
                    .map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          {/* Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Название релиза *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="например: Лирика Житухи"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Тип релиза</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="АЛЬБОМ">АЛЬБОМ</option>
                <option value="СИНГЛ">СИНГЛ</option>
                <option value="EP">EP</option>
              </select>
            </div>
          </div>

          {/* Artists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Основной исполнитель *</label>
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

          {/* Year & Explicit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExplicit}
                  onChange={(e) => setIsExplicit(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-rose-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs font-semibold text-zinc-200">Метка 18+ (Explicit)</span>
              </label>
            </div>
          </div>

          {/* Gradient */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Фоновый градиент релиза</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setGradient(preset.value)}
                  className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                    gradient === preset.value
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${preset.value} shrink-0`} />
                  <span className="text-[11px] text-zinc-300 truncate">{preset.label}</span>
                </button>
              ))}
            </div>
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{albumToEdit ? 'Сохранить релиз' : 'Создать релиз'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
