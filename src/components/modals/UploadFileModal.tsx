import React, { useState, useRef } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { X, UploadCloud, CheckCircle2, Music, Image as ImageIcon, Copy, Check } from 'lucide-react';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFolder?: 'tracks' | 'covers' | 'avatars' | 'banners';
  artistId?: string;
  onFileUploaded?: (filePath: string, duration?: string) => void;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  defaultFolder = 'covers',
  artistId = 'mc_ezdit',
  onFileUploaded,
}) => {
  const { uploadFile, token, repo, branch, catalog } = useCatalog();

  const [folder, setFolder] = useState<'tracks' | 'covers' | 'avatars' | 'banners'>(defaultFolder);
  const [selectedArtist, setSelectedArtist] = useState<string>(artistId || catalog?.customArtists[0]?.id || 'mc_ezdit');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFileName, setTargetFileName] = useState<string>('');
  const [detectedDuration, setDetectedDuration] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setTargetFileName(file.name);
    setUploadError(null);
    setUploadedPath(null);

    // If audio file, auto-detect duration
    if (file.type.startsWith('audio/') || file.name.endsWith('.mp3')) {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        const secs = Math.floor(audio.duration % 60);
        const mins = Math.floor(audio.duration / 60);
        const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        setDetectedDuration(durationStr);
        URL.revokeObjectURL(objectUrl);
      };
      if (folder !== 'tracks') setFolder('tracks');
    } else if (file.type.startsWith('image/')) {
      if (folder === 'tracks') setFolder('covers');
    }
  };

  const computeTargetPath = () => {
    const cleanName = targetFileName.trim().replace(/^\/+/, '');
    if (folder === 'tracks') {
      return `tracks/${selectedArtist}/${cleanName}`;
    }
    return `${folder}/${cleanName}`;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const path = computeTargetPath();
    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          // Extract base64 part
          const base64Data = result.split(',')[1];
          if (!base64Data) {
            throw new Error('Не удалось прочитать содержимое файла в base64.');
          }

          await uploadFile(
            path,
            base64Data,
            `Upload ${path} via DarkMusic Studio`
          );

          setUploadedPath(path);
          if (onFileUploaded) {
            onFileUploaded(path, detectedDuration);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Ошибка загрузки файла.';
          setUploadError(msg);
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Ошибка чтения локального файла.');
        setIsUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки.';
      setUploadError(msg);
      setIsUploading(false);
    }
  };

  const handleCopyPath = () => {
    if (uploadedPath) {
      navigator.clipboard.writeText(uploadedPath);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Загрузка медиа в GitHub</h3>
              <p className="text-xs text-zinc-400">
                {repo} ({branch})
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
        <div className="p-6 space-y-4">
          {uploadedPath ? (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-zinc-100">Файл успешно загружен в репозиторий!</h4>
              <div className="flex items-center justify-between gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300">
                <span className="truncate">{uploadedPath}</span>
                <button
                  onClick={handleCopyPath}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                  title="Скопировать путь"
                >
                  {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {detectedDuration && (
                <p className="text-xs text-emerald-400 font-mono">
                  Определена длительность: {detectedDuration}
                </p>
              )}

              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setUploadedPath(null);
                    setSelectedFile(null);
                    setTargetFileName('');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-colors"
                >
                  Загрузить ещё файл
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl transition-colors"
                >
                  Готово
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Folder Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Категория / Папка назначения:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['tracks', 'covers', 'avatars', 'banners'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFolder(cat)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-colors ${
                        folder === cat
                          ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cat === 'tracks' ? '🎵 Треки' : cat === 'covers' ? '🖼 Обложки' : cat === 'avatars' ? '👤 Аватары' : '🌄 Баннеры'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Artist selector if folder is tracks */}
              {folder === 'tracks' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Папка артиста (tracks/&lt;артист&gt;/):
                  </label>
                  <select
                    value={selectedArtist}
                    onChange={(e) => setSelectedArtist(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    {catalog?.customArtists.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.name} ({art.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-950/50 hover:bg-zinc-950"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={folder === 'tracks' ? 'audio/mp3,audio/*' : 'image/jpeg,image/png,image/webp'}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                      {folder === 'tracks' ? <Music className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      {detectedDuration && ` • ${detectedDuration}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-300">Нажмите для выбора файла</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {folder === 'tracks' ? 'Аудиофайлы .MP3' : 'Изображения .JPG, .PNG'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Target File Name */}
              {selectedFile && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Имя файла в репозитории:
                  </label>
                  <input
                    type="text"
                    value={targetFileName}
                    onChange={(e) => setTargetFileName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    Итоговый путь: {computeTargetPath()}
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {uploadError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!uploadedPath && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || !token.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Загрузка в GitHub...' : 'Загрузить в GitHub'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
