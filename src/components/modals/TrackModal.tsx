import React, { useState, useEffect, useRef } from 'react';
import { TrackRecord, PendingFileUpload } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { X, Music, Upload, CheckCircle2, Play, Pause, FileAudio, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUtils';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackToEdit?: TrackRecord | null;
}

export const TrackModal: React.FC<TrackModalProps> = ({
  isOpen,
  onClose,
  trackToEdit,
}) => {
  const { catalog, addTrack, updateTrack, repoFiles, addPendingFile, getPendingFileForPath } = useCatalog();
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [featArtistId, setFeatArtistId] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [filePath, setFilePath] = useState('');
  const [coverFile, setCoverFile] = useState('');
  const [duration, setDuration] = useState('2:30');
  const [year, setYear] = useState<number>(2026);
  const [isNew, setIsNew] = useState(true);
  const [isExplicit, setIsExplicit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  // Staged local file states for direct drag-and-drop / file input
  const [audioFileStaged, setAudioFileStaged] = useState<PendingFileUpload | null>(null);
  const [coverFileStaged, setCoverFileStaged] = useState<PendingFileUpload | null>(null);

  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (trackToEdit) {
      setTitle(trackToEdit.title || '');
      setArtistId(trackToEdit.artistId || catalog?.customArtists[0]?.id || '');
      setFeatArtistId(trackToEdit.featArtistId || '');
      setAlbumId(trackToEdit.albumId || '');
      setFilePath(trackToEdit.filePath || '');
      setCoverFile(trackToEdit.coverFile || '');
      setDuration(trackToEdit.duration || '2:30');
      setYear(trackToEdit.year || 2026);
      setIsNew(trackToEdit.isNew ?? true);
      setIsExplicit(trackToEdit.isExplicit ?? true);

      // Check if there are already pending files staged for these paths
      const stagedAudio = getPendingFileForPath(trackToEdit.filePath);
      setAudioFileStaged(stagedAudio || null);
      const stagedCover = getPendingFileForPath(trackToEdit.coverFile);
      setCoverFileStaged(stagedCover || null);
    } else {
      const defaultArt = catalog?.customArtists[0]?.id || 'mc_ezdit';
      setTitle('');
      setArtistId(defaultArt);
      setFeatArtistId('');
      setAlbumId('');
      setFilePath('');
      setCoverFile('');
      setDuration('2:30');
      setYear(2026);
      setIsNew(true);
      setIsExplicit(true);
      setAudioFileStaged(null);
      setCoverFileStaged(null);
    }
    setError(null);
    setSizeWarning(null);
  }, [trackToEdit, isOpen, catalog, getPendingFileForPath]);

  if (!isOpen) return null;

  const availableAlbums = catalog?.customAlbums.filter(
    (alb) => alb.artistId === artistId || alb.featArtistId === artistId
  ) || [];

  // Handle local MP3 file selection directly in modal
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setSizeWarning(`Файл «${file.name}» весит ${(file.size / (1024 * 1024)).toFixed(1)} MB. Лимит GitHub API для одного файла — 25 MB.`);
    } else {
      setSizeWarning(null);
    }

    // Auto compute title if empty
    if (!title.trim()) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/^[^-]+-\s*/, '').trim();
      if (cleanTitle) setTitle(cleanTitle);
    }

    const targetPath = `tracks/${artistId}/${file.name}`;
    setFilePath(targetPath);

    // Create local object URL for instant preview and duration calculation
    const previewUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = previewUrl;
    audio.onloadedmetadata = () => {
      const mins = Math.floor(audio.duration / 60);
      const secs = Math.floor(audio.duration % 60);
      const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      setDuration(durStr);
    };

    // Read base64 for pending upload
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] || '';
      const pending: PendingFileUpload = {
        id: `file_trk_${Date.now()}`,
        filePath: targetPath,
        file,
        base64Content: b64,
        size: file.size,
        previewUrl,
        category: 'tracks',
      };
      setAudioFileStaged(pending);
    };
    reader.readAsDataURL(file);
  };

  // Handle local Cover file selection directly in modal
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetPath = `covers/${file.name}`;
    setCoverFile(targetPath);

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] || '';
      const pending: PendingFileUpload = {
        id: `file_cov_${Date.now()}`,
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
      setError('Название трека обязательно.');
      return;
    }
    if (!artistId.trim()) {
      setError('Выберите исполнителя.');
      return;
    }
    if (!filePath.trim()) {
      setError('Укажите путь к аудиофайлу или выберите MP3 файл с устройства.');
      return;
    }

    // Queue pending files in context if selected
    if (audioFileStaged) {
      addPendingFile({
        ...audioFileStaged,
        filePath: filePath.trim(), // ensure current filePath is synced
      });
    }
    if (coverFileStaged && coverFile.trim()) {
      addPendingFile({
        ...coverFileStaged,
        filePath: coverFile.trim(),
      });
    }

    const id = trackToEdit?.id || `trk_${Date.now()}`;
    const record: TrackRecord = {
      id,
      title: title.trim(),
      artistId: artistId.trim(),
      featArtistId: featArtistId.trim() || undefined,
      albumId: albumId.trim() || '',
      filePath: filePath.trim(),
      coverFile: coverFile.trim(),
      duration: duration.trim() || '2:30',
      year: Number(year) || 2026,
      isNew: Boolean(isNew),
      isExplicit: Boolean(isExplicit),
      createdAt: trackToEdit?.createdAt || Date.now(),
    };

    if (trackToEdit) {
      updateTrack(trackToEdit.id, record);
    } else {
      addTrack(record);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {trackToEdit ? 'Редактировать трек' : 'Добавить новый трек'}
              </h3>
              <p className="text-xs text-zinc-400">
                Выберите MP3 файл прямо здесь — он автоматически загрузится в GitHub при публикации
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Audio File Direct Dropzone */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <FileAudio className="w-4 h-4 text-emerald-400" />
                <span>Аудиофайл трека (.MP3)</span>
              </label>

              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{audioFileStaged ? 'Заменить MP3' : 'Выбрать MP3 с устройства'}</span>
              </button>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mp3,audio/*"
                onChange={handleAudioFileSelect}
                className="hidden"
              />
            </div>

            {audioFileStaged ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-zinc-100 truncate block">
                      {audioFileStaged.file.name}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      {(audioFileStaged.size / 1024 / 1024).toFixed(2)} MB • {duration} • Будет загружен в GitHub
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const tempTrk: TrackRecord = {
                      id: 'preview_temp',
                      title: title || audioFileStaged.file.name,
                      artistId,
                      albumId,
                      filePath,
                      coverFile,
                      duration,
                      year,
                      isNew,
                      isExplicit,
                      createdAt: Date.now(),
                    };
                    playTrack(tempTrk, audioFileStaged.previewUrl);
                  }}
                  className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shrink-0 ml-2"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Слушать
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Нажмите «Выбрать MP3 с устройства» — длительность определится автоматически, а файл прикрепится к общей публикации в GitHub.
              </p>
            )}

            {sizeWarning && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{sizeWarning}</span>
              </div>
            )}

            {/* Manual / Existing path */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Путь к файлу в репозитории:
              </label>
              <input
                type="text"
                required
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder={`tracks/${artistId}/track_name.mp3`}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />

              {repoFiles.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setFilePath(e.target.value);
                      setAudioFileStaged(null);
                    }
                  }}
                  className="mt-1 w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 font-mono"
                >
                  <option value="">-- Или выбрать уже существующий трек в GitHub --</option>
                  {repoFiles
                    .filter((f) => f.startsWith('tracks/'))
                    .map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Название трека *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например: Лирика Житухи"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Artists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Основной артист *</label>
              <select
                required
                value={artistId}
                onChange={(e) => {
                  setArtistId(e.target.value);
                  setAlbumId('');
                  if (audioFileStaged) {
                    setFilePath(`tracks/${e.target.value}/${audioFileStaged.file.name}`);
                  }
                }}
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

          {/* Album Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Альбом / Релиз</label>
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">— Сингл без альбома —</option>
              {availableAlbums.map((alb) => (
                <option key={alb.id} value={alb.id}>
                  {alb.title} ({alb.type}, {alb.year})
                </option>
              ))}
            </select>
          </div>

          {/* Duration & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Длительность (ММ:СС)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="2:57"
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

          {/* Custom Cover Option */}
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Индивидуальная обложка (для сингла или специальная)</span>
              </label>

              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Выбрать с устройства</span>
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFileSelect}
                className="hidden"
              />
            </div>

            {coverFileStaged ? (
              <div className="flex items-center gap-3 p-2 bg-zinc-900 rounded-lg border border-purple-500/30">
                <img
                  src={coverFileStaged.previewUrl}
                  alt="Cover preview"
                  className="w-10 h-10 object-cover rounded-md border border-zinc-700"
                />
                <div className="truncate text-xs">
                  <span className="font-semibold text-zinc-200 block truncate">
                    {coverFileStaged.file.name}
                  </span>
                  <span className="text-[10px] text-purple-400">
                    Будет загружен в <code>{coverFile}</code>
                  </span>
                </div>
              </div>
            ) : coverFile ? (
              <div className="flex items-center gap-3 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <img
                  src={resolveMediaUrl(coverFile, getPendingFileForPath)}
                  alt="Cover preview"
                  className="w-10 h-10 object-cover rounded-md border border-zinc-700"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="truncate text-xs">
                  <span className="font-semibold text-zinc-300 block truncate font-mono text-[11px]">
                    {coverFile}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Предпросмотр обложки
                  </span>
                </div>
              </div>
            ) : null}

            <input
              type="text"
              value={coverFile}
              onChange={(e) => setCoverFile(e.target.value)}
              placeholder="covers/alb_sosiska.jpg (оставьте пустым для наследования из альбома)"
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Badges toggles: isNew & isExplicit */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-purple-600 focus:ring-0"
              />
              <span className="text-xs font-medium text-zinc-200">Отметить как «NEW»</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExplicit}
                onChange={(e) => setIsExplicit(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-rose-500 focus:ring-0"
              />
              <span className="text-xs font-medium text-zinc-200">Отметка 18+ (Explicit)</span>
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{trackToEdit ? 'Сохранить изменения' : 'Добавить в каталог'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
