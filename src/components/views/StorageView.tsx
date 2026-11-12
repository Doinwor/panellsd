import React, { useState, useMemo } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { DEFAULT_REPO, DEFAULT_BRANCH } from '../../services/githubApi';
import {
  Folder,
  FolderOpen,
  FileAudio,
  Image as ImageIcon,
  FileText,
  Search,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  ExternalLink,
  HardDrive,
  Filter,
  Eye,
  X,
  UploadCloud,
} from 'lucide-react';
import { RepoFileItem } from '../../types/catalog';
import { resolveMediaUrl } from '../../utils/mediaUtils';

export const StorageView: React.FC = () => {
  const {
    repo,
    branch,
    repoFiles,
    repoFileItems,
    refreshRepoFiles,
    deleteFileFromRepo,
    getFileUsage,
    pendingFiles,
    removePendingFile,
    isTokenValid,
    getPendingFileForPath,
  } = useCatalog();

  const { playTrack, currentTrack, isPlaying, togglePlay, audioUrl } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'images' | 'unused' | 'used' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size_desc' | 'size_asc'>('name');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states for delete confirmation
  const [fileToDelete, setFileToDelete] = useState<{ path: string; sha?: string; size?: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Full image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRepoFiles();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Combine remote files and local staged files for unified storage view
  const allFiles = useMemo(() => {
    const list: Array<{
      path: string;
      sha?: string;
      size?: number;
      isPending?: boolean;
      previewUrl?: string;
    }> = [];

    // Map of existing remote paths
    const remotePaths = new Set<string>();

    repoFileItems.forEach((item) => {
      remotePaths.add(item.path);
      list.push({
        path: item.path,
        sha: item.sha,
        size: item.size,
        isPending: false,
      });
    });

    // If repoFileItems is empty but repoFiles has strings, populate
    if (repoFileItems.length === 0 && repoFiles.length > 0) {
      repoFiles.forEach((p) => {
        if (!remotePaths.has(p)) {
          remotePaths.add(p);
          list.push({
            path: p,
            isPending: false,
          });
        }
      });
    }

    // Add locally pending (staged) files
    pendingFiles.forEach((pf) => {
      if (!remotePaths.has(pf.filePath)) {
        list.push({
          path: pf.filePath,
          size: pf.size,
          isPending: true,
          previewUrl: pf.previewUrl,
        });
      }
    });

    return list;
  }, [repoFileItems, repoFiles, pendingFiles]);

  // Extract folder hierarchy
  const folders = useMemo(() => {
    const set = new Set<string>();
    allFiles.forEach((f) => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        set.add(parts[0]); // top level folder: tracks, covers, avatars, banners, etc.
      } else {
        set.add('root');
      }
    });
    return Array.from(set).sort();
  }, [allFiles]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return allFiles.filter((file) => {
      // Folder filter
      if (selectedFolder !== 'all') {
        if (selectedFolder === 'root') {
          if (file.path.includes('/')) return false;
        } else {
          if (!file.path.startsWith(`${selectedFolder}/`)) return false;
        }
      }

      const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.path);
      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.path);
      const usage = getFileUsage(file.path);

      // Type filter
      if (filterType === 'audio' && !isAudio) return false;
      if (filterType === 'images' && !isImage) return false;
      if (filterType === 'unused' && usage.isUsed) return false;
      if (filterType === 'used' && !usage.isUsed) return false;
      if (filterType === 'pending' && !file.isPending) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPath = file.path.toLowerCase().includes(q);
        const matchesUsage = usage.usages.some(
          (u) =>
            u.entityTitle.toLowerCase().includes(q) ||
            u.description.toLowerCase().includes(q)
        );
        if (!matchesPath && !matchesUsage) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'size_desc') return (b.size || 0) - (a.size || 0);
      if (sortBy === 'size_asc') return (a.size || 0) - (b.size || 0);
      return a.path.localeCompare(b.path);
    });
  }, [allFiles, selectedFolder, filterType, searchQuery, sortBy, getFileUsage]);

  // Statistics
  const stats = useMemo(() => {
    let totalSize = 0;
    let usedCount = 0;
    let unusedCount = 0;
    let audioCount = 0;
    let imagesCount = 0;

    allFiles.forEach((f) => {
      if (f.size) totalSize += f.size;
      const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(f.path);
      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.path);
      if (isAudio) audioCount++;
      if (isImage) imagesCount++;

      const usage = getFileUsage(f.path);
      if (usage.isUsed) {
        usedCount++;
      } else {
        unusedCount++;
      }
    });

    return {
      totalFiles: allFiles.length,
      totalSizeMb: (totalSize / (1024 * 1024)).toFixed(1),
      usedCount,
      unusedCount,
      audioCount,
      imagesCount,
    };
  }, [allFiles, getFileUsage]);

  // Handle file deletion
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (fileToDelete.size !== undefined && pendingFiles.some((p) => p.filePath === fileToDelete.path)) {
        removePendingFile(fileToDelete.path);
        setDeleteSuccess(`Локальный файл «${fileToDelete.path}» успешно удален из очереди.`);
      } else {
        await deleteFileFromRepo(fileToDelete.path, fileToDelete.sha);
        setDeleteSuccess(`Файл «${fileToDelete.path}» успешно удален из репозитория GitHub.`);
      }
      setFileToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось удалить файл.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const isCurrentAudioPlaying = (path: string) => {
    const soundUrl = resolveMediaUrl(path, getPendingFileForPath);
    return (
      isPlaying &&
      (currentTrack?.filePath === path || audioUrl === soundUrl)
    );
  };

  const handleAudioToggle = (path: string) => {
    const soundUrl = resolveMediaUrl(path, getPendingFileForPath);
    if (isCurrentAudioPlaying(path)) {
      togglePlay();
    } else {
      // Find track or construct temporary record for player
      playTrack(
        {
          id: `storage_${path}`,
          title: path.split('/').pop() || path,
          artistId: 'darkmusic',
          albumId: '',
          duration: '0:00',
          filePath: path,
          coverFile: 'covers/default.jpg',
          year: 2026,
          isNew: false,
          isExplicit: false,
          createdAt: Date.now(),
        },
        soundUrl
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <span>Медиафайлы репозитория</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
              {stats.totalFiles} файлов • {stats.totalSizeMb} MB
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Просмотр аудио и обложек в GitHub, отслеживание привязки к трекам и удаление неиспользуемых файлов
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
            title="Перезагрузить дерево файлов с GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span>Обновить из GitHub</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Всего в репозитории</span>
            <p className="text-base font-bold text-zinc-100 font-mono tabular-nums">{stats.totalFiles}</p>
          </div>
          <Folder className="w-5 h-5 text-zinc-600" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400 font-medium">Используются в каталоге</span>
            <p className="text-base font-bold text-emerald-300 font-mono tabular-nums">{stats.usedCount}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400 font-medium">Нигде не используются</span>
            <p className="text-base font-bold text-amber-300 font-mono tabular-nums">{stats.unusedCount}</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-500/50" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-purple-400 font-medium">Аудио / Обложки</span>
            <p className="text-base font-bold text-purple-300 font-mono tabular-nums">
              {stats.audioCount} / {stats.imagesCount}
            </p>
          </div>
          <FileAudio className="w-5 h-5 text-purple-500/50" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени файла, папке, названию трека или альбома..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Все ({allFiles.length})
            </button>
            <button
              onClick={() => setFilterType('unused')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === 'unused'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800/80 text-amber-400 hover:text-amber-300 hover:bg-zinc-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Неиспользуемые ({stats.unusedCount})</span>
            </button>
            <button
              onClick={() => setFilterType('audio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'audio'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Аудио ({stats.audioCount})
            </button>
            <button
              onClick={() => setFilterType('images')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'images'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Картинки ({stats.imagesCount})
            </button>
            {pendingFiles.length > 0 && (
              <button
                onClick={() => setFilterType('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                  filterType === 'pending'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-zinc-800/80 text-pink-400 hover:text-pink-300 hover:bg-zinc-800'
                }`}
              >
                <UploadCloud className="w-3 h-3" />
                <span>Ожидают ({pendingFiles.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 whitespace-nowrap">Сортировка:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'size_desc' | 'size_asc')}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="name">По имени (A-Z)</option>
              <option value="size_desc">Размер: сначала тяжелые ↓</option>
              <option value="size_asc">Размер: сначала легкие ↑</option>
            </select>
          </div>
        </div>
      </div>

      {/* Folder Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-zinc-500 shrink-0 font-medium flex items-center gap-1">
          <FolderOpen className="w-3.5 h-3.5" />
          Папка:
        </span>
        <button
          onClick={() => setSelectedFolder('all')}
          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-all ${
            selectedFolder === 'all'
              ? 'bg-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Все папки
        </button>
        {folders.map((f) => {
          const count = allFiles.filter((file) =>
            f === 'root' ? !file.path.includes('/') : file.path.startsWith(`${f}/`)
          ).length;
          return (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedFolder === f
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{f === 'root' ? 'Корень репозитория' : `${f}/`}</span>
              <span className="opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {deleteSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{deleteSuccess}</span>
          </div>
          <button onClick={() => setDeleteSuccess(null)} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>
      )}

      {deleteError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button onClick={() => setDeleteError(null)} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>
      )}

      {/* File List */}
      <div className="space-y-2.5">
        {filteredFiles.length === 0 ? (
          <div className="p-12 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
            <HardDrive className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">Файлы не найдены</p>
            <p className="text-xs text-zinc-500">
              Попробуйте изменить параметры поиска или фильтрации по папкам.
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.path);
            const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.path);
            const usage = getFileUsage(file.path);
            const rawUrl = `https://raw.githubusercontent.com/${DEFAULT_REPO}/${DEFAULT_BRANCH}/${encodeURI(file.path)}`;
            const isPlayingThis = isCurrentAudioPlaying(file.path);

            return (
              <div
                key={file.path}
                className={`p-3.5 rounded-xl bg-zinc-900/70 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 ${
                  file.isPending
                    ? 'border-pink-500/40 bg-pink-950/10'
                    : !usage.isUsed
                    ? 'border-amber-500/30 bg-amber-950/5'
                    : 'border-zinc-800'
                }`}
              >
                {/* File info and preview */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail / Icon */}
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {isAudio ? (
                      <button
                        onClick={() => handleAudioToggle(file.path)}
                        className="w-full h-full flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                        title={isPlayingThis ? 'Пауза' : 'Слушать аудиофайл'}
                      >
                        {isPlayingThis ? (
                          <Pause className="w-5 h-5 fill-current animate-pulse" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    ) : isImage ? (
                      <div
                        onClick={() => setPreviewImage(file.previewUrl || resolveMediaUrl(file.path, getPendingFileForPath))}
                        className="w-full h-full cursor-pointer relative"
                        title="Нажмите для просмотра на весь экран"
                      >
                        <img
                          src={file.previewUrl || resolveMediaUrl(file.path, getPendingFileForPath)}
                          alt={file.path}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <FileText className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>

                  {/* Path & size details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                        {file.path}
                      </span>
                      {file.isPending && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300">
                          Локальный черновик (ожидает публикации)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 font-mono">
                      {file.size !== undefined && (
                        <span>
                          {file.size > 1024 * 1024
                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${(file.size / 1024).toFixed(1)} KB`}
                        </span>
                      )}
                      {file.sha && <span>sha: {file.sha.substring(0, 7)}</span>}
                      {!file.isPending && (
                        <a
                          href={`https://github.com/${repo}/blob/${branch}/${file.path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-zinc-300 flex items-center gap-0.5 transition-colors"
                        >
                          <span>В GitHub</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Usage status display */}
                <div className="md:w-80 shrink-0">
                  {usage.isUsed ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" />
                        Используется ({usage.usages.length})
                      </span>
                      <div className="space-y-1 mt-1">
                        {usage.usages.map((u, i) => (
                          <div
                            key={i}
                            className="text-[11px] text-zinc-300 truncate bg-zinc-950/60 border border-zinc-800/80 px-2 py-1 rounded-lg"
                            title={u.description}
                          >
                            {u.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold text-[11px]">Нигде не используется</span>
                    </div>
                  )}
                </div>

                {/* Delete Action Button */}
                <div className="flex items-center justify-end shrink-0">
                  <button
                    onClick={() =>
                      setFileToDelete({
                        path: file.path,
                        sha: file.sha,
                        size: file.size,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-700/60 hover:border-rose-500/40 text-xs font-semibold transition-all"
                    title="Удалить файл"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Удаление файла</h3>
                <p className="text-xs text-zinc-400">Действие нельзя будет отменить</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 break-all">
              {fileToDelete.path}
            </div>

            {(() => {
              const usage = getFileUsage(fileToDelete.path);
              if (usage.isUsed) {
                return (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Внимание: файл используется в каталоге!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Этот файл прикреплен к:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {usage.usages.map((u, idx) => (
                        <li key={idx}>{u.description}</li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-rose-300/80 pt-1">
                      После удаления трек перестанет воспроизводиться или обложка пропадет в приложении.
                    </p>
                  </div>
                );
              }
              return (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs">
                  Этот файл нигде не используется в приложении и может быть безопасно удален для очистки репозитория.
                </div>
              );
            })()}

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Удаление...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить навсегда</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 p-2 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] w-auto object-contain mx-auto rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
