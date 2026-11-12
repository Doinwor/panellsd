import React, { useState, useEffect, useRef } from 'react';
import { ArtistRecord, PendingFileUpload } from '../../types/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { X, Plus, Trash2, User, Sparkles, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface ArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistToEdit?: ArtistRecord | null;
}

const GRADIENT_PRESETS = [
  { label: 'Amber / Orange', value: 'from-amber-600 via-orange-950 to-zinc-950' },
  { label: 'Sky / Blue', value: 'from-sky-600 via-blue-950 to-zinc-950' },
  { label: 'Fuchsia / Purple', value: 'from-fuchsia-600 via-purple-950 to-zinc-950' },
  { label: 'Emerald / Teal', value: 'from-emerald-600 via-teal-900 to-zinc-950' },
  { label: 'Rose / Red', value: 'from-rose-600 via-red-900 to-zinc-950' },
  { label: 'Indigo / Violet', value: 'from-purple-600 via-indigo-900 to-zinc-950' },
];

const ICON_PRESETS = [
  'fa-crown',
  'fa-user-astronaut',
  'fa-gauge-high',
  'fa-microphone-lines',
  'fa-fire',
  'fa-bolt',
  'fa-skull',
  'fa-headphones',
  'fa-music',
  'fa-star',
];

function transliterateRussian(str: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ' ': '_',
  };
  return str
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9_]/g, '');
}

export const ArtistModal: React.FC<ArtistModalProps> = ({
  isOpen,
  onClose,
  artistToEdit,
}) => {
  const { addArtist, updateArtist, repoFiles, addPendingFile, getPendingFileForPath } = useCatalog();

  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [role, setRole] = useState('Рэп');
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].value);
  const [icon, setIcon] = useState('fa-crown');
  const [avatarFile, setAvatarFile] = useState('');
  const [bannerFile, setBannerFile] = useState('');
  const [bio, setBio] = useState('');
  const [facts, setFacts] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  const [avatarStaged, setAvatarStaged] = useState<PendingFileUpload | null>(null);
  const [bannerStaged, setBannerStaged] = useState<PendingFileUpload | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (artistToEdit) {
      setName(artistToEdit.name || '');
      setId(artistToEdit.id || '');
      setRole(artistToEdit.role || 'Рэп');
      setGradient(artistToEdit.gradient || GRADIENT_PRESETS[0].value);
      setIcon(artistToEdit.icon || 'fa-crown');
      setAvatarFile(artistToEdit.avatarFile || '');
      setBannerFile(artistToEdit.bannerFile || '');
      setBio(artistToEdit.bio || '');
      setFacts(artistToEdit.facts && artistToEdit.facts.length > 0 ? [...artistToEdit.facts] : ['']);

      const stagedAv = getPendingFileForPath(artistToEdit.avatarFile);
      setAvatarStaged(stagedAv || null);
      const stagedBn = artistToEdit.bannerFile ? getPendingFileForPath(artistToEdit.bannerFile) : undefined;
      setBannerStaged(stagedBn || null);
    } else {
      setName('');
      setId('');
      setRole('Рэп');
      setGradient(GRADIENT_PRESETS[0].value);
      setIcon('fa-crown');
      setAvatarFile('');
      setBannerFile('');
      setBio('');
      setFacts(['']);
      setAvatarStaged(null);
      setBannerStaged(null);
    }
    setError(null);
  }, [artistToEdit, isOpen, getPendingFileForPath]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!artistToEdit && (!id || id.startsWith('mc_') || id.startsWith('art_'))) {
      const translit = transliterateRussian(val);
      setId(translit ? `mc_${translit}` : '');
      if (!avatarFile) setAvatarFile(`avatars/mc_${translit}.jpg`);
      if (!bannerFile) setBannerFile(`banners/mc_${translit}2.jpg`);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetPath = `avatars/${id || 'artist'}.jpg`;
    setAvatarFile(targetPath);

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] || '';
      const pending: PendingFileUpload = {
        id: `file_av_${Date.now()}`,
        filePath: targetPath,
        file,
        base64Content: b64,
        size: file.size,
        previewUrl,
        category: 'avatars',
      };
      setAvatarStaged(pending);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetPath = `banners/${id || 'artist'}2.jpg`;
    setBannerFile(targetPath);

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] || '';
      const pending: PendingFileUpload = {
        id: `file_bn_${Date.now()}`,
        filePath: targetPath,
        file,
        base64Content: b64,
        size: file.size,
        previewUrl,
        category: 'banners',
      };
      setBannerStaged(pending);
    };
    reader.readAsDataURL(file);
  };

  const handleAddFact = () => {
    setFacts([...facts, '']);
  };

  const handleUpdateFact = (idx: number, val: string) => {
    const copy = [...facts];
    copy[idx] = val;
    setFacts(copy);
  };

  const handleDeleteFact = (idx: number) => {
    setFacts(facts.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Имя артиста обязательно.');
      return;
    }
    if (!id.trim()) {
      setError('ID артиста обязателен.');
      return;
    }

    if (avatarStaged) {
      addPendingFile({
        ...avatarStaged,
        filePath: avatarFile.trim(),
      });
    }

    if (bannerStaged && bannerFile.trim()) {
      addPendingFile({
        ...bannerStaged,
        filePath: bannerFile.trim(),
      });
    }

    const cleanFacts = facts.map((f) => f.trim()).filter(Boolean);

    const record: ArtistRecord = {
      id: id.trim(),
      name: name.trim(),
      role: role.trim() || 'Рэп',
      gradient,
      icon,
      avatarFile: avatarFile.trim() || `avatars/${id.trim()}.jpg`,
      bannerFile: bannerFile.trim() || `banners/${id.trim()}2.jpg`,
      bio: bio.trim(),
      facts: cleanFacts,
      isCustom: true,
      createdAt: artistToEdit?.createdAt || Date.now(),
    };

    if (artistToEdit) {
      updateArtist(artistToEdit.id, record);
    } else {
      addArtist(record);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {artistToEdit ? 'Редактировать артиста' : 'Добавить нового артиста'}
              </h3>
              <p className="text-xs text-zinc-400">Параметры профиля, аватар, баннер и факты</p>
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
          {/* Preview Card */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} p-0.5 flex items-center justify-center shadow-lg`}
              >
                <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center text-zinc-300 overflow-hidden">
                  {avatarStaged ? (
                    <img src={avatarStaged.previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <i className={`fa-solid ${icon} text-xl`} />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-100">{name || 'Имя артиста'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-purple-400">
                    {role || 'Роль'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">id: {id || 'mc_artist'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Предпросмотр
              </span>
            </div>
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Имя артиста *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="например: МС МАКАКА"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Уникальный ID (slug) *</label>
              <input
                type="text"
                required
                disabled={Boolean(artistToEdit)}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="mc_makaka"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Жанр / Роль</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Рэп, Продюсер, Битмейкер"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Иконка FontAwesome</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                />
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                  <i className={`fa-solid ${icon}`} />
                </div>
              </div>
              <div className="flex gap-1 mt-1.5 overflow-x-auto pb-1">
                {ICON_PRESETS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-1.5 rounded-lg text-xs border transition-colors shrink-0 ${
                      icon === ic
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <i className={`fa-solid ${ic}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gradient */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Цветовой градиент карточки</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setGradient(preset.value)}
                  className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                    gradient === preset.value
                      ? 'border-purple-500 bg-purple-950/20 shadow-md'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${preset.value} shrink-0`} />
                  <span className="text-[11px] text-zinc-300 truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media Direct Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avatar */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Аватар артиста</span>
                </label>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Выбрать файл</span>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>

              {avatarStaged && (
                <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-purple-500/30 text-xs">
                  <img src={avatarStaged.previewUrl} alt="Av" className="w-8 h-8 rounded-full object-cover" />
                  <span className="truncate text-zinc-300">{avatarStaged.file.name}</span>
                </div>
              )}

              <input
                type="text"
                value={avatarFile}
                onChange={(e) => setAvatarFile(e.target.value)}
                placeholder="avatars/mc_makaka.jpg"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Banner */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Баннер артиста</span>
                </label>
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Выбрать файл</span>
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  className="hidden"
                />
              </div>

              {bannerStaged && (
                <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-indigo-500/30 text-xs">
                  <img src={bannerStaged.previewUrl} alt="Bn" className="w-12 h-6 rounded object-cover" />
                  <span className="truncate text-zinc-300">{bannerStaged.file.name}</span>
                </div>
              )}

              <input
                type="text"
                value={bannerFile}
                onChange={(e) => setBannerFile(e.target.value)}
                placeholder="banners/mc_makaka2.jpg"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Биография</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Краткое описание творческого пути артиста..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Facts list */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">Интересные факты ({facts.length})</label>
              <button
                type="button"
                onClick={handleAddFact}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Добавить факт
              </button>
            </div>
            <div className="space-y-2">
              {facts.map((fact, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-500 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={fact}
                    onChange={(e) => handleUpdateFact(idx, e.target.value)}
                    placeholder="Например: Записывает треки с одного дубля"
                    className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFact(idx)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
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
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{artistToEdit ? 'Сохранить изменения' : 'Добавить артиста'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
