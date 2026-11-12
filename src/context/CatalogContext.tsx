import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CatalogRoot,
  ArtistRecord,
  AlbumRecord,
  TrackRecord,
  VideoRecord,
  NewsRecord,
  SystemBroadcast,
  ForceUpdateConfig,
  WhatsNewConfig,
  GitHubUserProfile,
  DiffChange,
  PendingFileUpload,
  PublishProgressState,
  RepoFileItem,
  FileUsageInfo,
} from '../types/catalog';
import {
  DEFAULT_REPO,
  DEFAULT_BRANCH,
  DEFAULT_TOKEN,
  fetchCatalogFromGitHub,
  commitCatalogToGitHub,
  uploadBinaryFileToGitHub,
  deleteFileFromGitHub,
  verifyGitHubToken,
  fetchRepoFileTree,
  fetchRepoDetailedTree,
} from '../services/githubApi';

interface CatalogContextType {
  catalog: CatalogRoot | null;
  originalCatalog: CatalogRoot | null;
  sha: string;
  isLoading: boolean;
  isSaving: boolean;
  savingStatusText: string;
  publishProgress: PublishProgressState;
  cancelPublish: () => void;
  error: string | null;
  token: string;
  repo: string;
  branch: string;
  userProfile: GitHubUserProfile | null;
  isTokenValid: boolean;
  isVerifyingToken: boolean;
  repoFiles: string[];
  repoFileItems: RepoFileItem[];
  diffs: DiffChange[];
  hasUnsavedChanges: boolean;
  pendingFiles: PendingFileUpload[];

  // Pending files actions
  addPendingFile: (pending: PendingFileUpload) => void;
  removePendingFile: (filePath: string) => void;
  clearPendingFiles: () => void;
  getPendingFileForPath: (filePath: string) => PendingFileUpload | undefined;

  // Media storage actions
  refreshRepoFiles: () => Promise<void>;
  deleteFileFromRepo: (filePath: string, sha?: string) => Promise<void>;
  getFileUsage: (filePath: string) => FileUsageInfo;

  // Configuration actions
  setToken: (token: string) => void;
  setRepo: (repo: string) => void;
  setBranch: (branch: string) => void;
  refreshCatalog: () => Promise<void>;
  discardDraft: () => void;
  downloadJson: () => void;
  publishToGitHub: (
    commitMessage?: string,
    onProgress?: (status: string, current: number, total: number) => void
  ) => Promise<{ commitSha: string; commitUrl: string }>;
  uploadFile: (filePath: string, base64Content: string, commitMessage?: string) => Promise<{ fileUrl: string }>;
  sendInstantPushNotification: (
    title: string,
    message: string,
    imageFile?: string
  ) => Promise<{ commitSha: string; commitUrl: string }>;

  // CRUD actions
  addArtist: (artist: ArtistRecord) => void;
  updateArtist: (id: string, updates: Partial<ArtistRecord>) => void;
  deleteArtist: (id: string) => void;

  addAlbum: (album: AlbumRecord) => void;
  updateAlbum: (id: string, updates: Partial<AlbumRecord>) => void;
  deleteAlbum: (id: string) => void;

  addTrack: (track: TrackRecord) => void;
  updateTrack: (id: string, updates: Partial<TrackRecord>) => void;
  deleteTrack: (id: string) => void;
  reorderTracks: (trackId: string, direction: 'up' | 'down', targetTrackId?: string) => void;

  addVideo: (video: VideoRecord) => void;
  updateVideo: (id: string, updates: Partial<VideoRecord>) => void;
  deleteVideo: (id: string) => void;

  addNews: (news: NewsRecord) => void;
  updateNews: (id: string, updates: Partial<NewsRecord>) => void;
  deleteNews: (id: string) => void;

  updateBroadcast: (
    key: 'systemPushBroadcast' | 'tempBroadcast' | 'pinnedBroadcast',
    data: Partial<SystemBroadcast>
  ) => void;
  updateForceUpdate: (data: Partial<ForceUpdateConfig>) => void;
  updateWhatsNew: (data: Partial<WhatsNewConfig>) => void;
}

const CatalogContext = createContext<CatalogContextType | null>(null);

const STORAGE_KEYS = {
  TOKEN: 'darkmusic_gh_token',
  REPO: 'darkmusic_gh_repo',
  BRANCH: 'darkmusic_gh_branch',
  DRAFT: 'darkmusic_draft_catalog',
};

// Synchronize legacy dictionary maps from customArtists array
function syncLegacyArtistDictionaries(cat: CatalogRoot): CatalogRoot {
  const avatars: Record<string, string> = { ...cat.avatars };
  const artistBanners: Record<string, string> = { ...cat.artistBanners };
  const artistNames: Record<string, string> = { ...cat.artistNames };
  const artistBios: Record<string, string> = { ...cat.artistBios };
  const artistRoles: Record<string, string> = { ...cat.artistRoles };
  const artistFacts: Record<string, string[]> = { ...cat.artistFacts };
  const artistGradients: Record<string, string> = { ...cat.artistGradients };
  const artistIcons: Record<string, string> = { ...cat.artistIcons };

  (cat.customArtists || []).forEach((art) => {
    artistNames[art.id] = art.name || '';
    artistBios[art.id] = art.bio || '';
    artistRoles[art.id] = art.role || '';
    artistFacts[art.id] = Array.isArray(art.facts) ? art.facts : [];
    artistGradients[art.id] = art.gradient || 'from-purple-900 to-indigo-900';
    artistIcons[art.id] = art.icon || 'fa-microphone';
    if (art.avatarFile) avatars[art.id] = art.avatarFile;
    if (art.bannerFile) artistBanners[art.id] = art.bannerFile;
  });

  return {
    ...cat,
    avatars,
    artistBanners,
    artistNames,
    artistBios,
    artistRoles,
    artistFacts,
    artistGradients,
    artistIcons,
    updatedAt: Date.now(),
  };
}

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || DEFAULT_TOKEN;
  });
  const [repo, setRepoState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.REPO) || DEFAULT_REPO;
  });
  const [branch, setBranchState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.BRANCH) || DEFAULT_BRANCH;
  });

  const [catalog, setCatalog] = useState<CatalogRoot | null>(null);
  const [originalCatalog, setOriginalCatalog] = useState<CatalogRoot | null>(null);
  const [sha, setSha] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savingStatusText, setSavingStatusText] = useState<string>('');
  const [publishProgress, setPublishProgress] = useState<PublishProgressState>({
    isActive: false,
    currentStep: 0,
    totalSteps: 0,
    percentage: 0,
    stepTitle: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFileUpload[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPublish = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSaving(false);
    setSavingStatusText('');
    setPublishProgress({
      isActive: false,
      currentStep: 0,
      totalSteps: 0,
      percentage: 0,
      stepTitle: 'Загрузка отменена',
    });
    setError('Загрузка была отменена. Все ваши изменения и выбранные файлы сохранены в черновике — вы можете повторить попытку.');
  }, []);

  const [userProfile, setUserProfile] = useState<GitHubUserProfile | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [repoFiles, setRepoFiles] = useState<string[]>([]);
  const [repoFileItems, setRepoFileItems] = useState<RepoFileItem[]>([]);

  const addPendingFile = useCallback((pending: PendingFileUpload) => {
    setPendingFiles((prev) => {
      // Remove any previously staged file with the same filePath
      const filtered = prev.filter((p) => p.filePath !== pending.filePath);
      return [...filtered, pending];
    });
  }, []);

  const removePendingFile = useCallback((filePath: string) => {
    setPendingFiles((prev) => {
      const match = prev.find((p) => p.filePath === filePath);
      if (match?.previewUrl && match.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(match.previewUrl);
      }
      return prev.filter((p) => p.filePath !== filePath);
    });
  }, []);

  const clearPendingFiles = useCallback(() => {
    setPendingFiles((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl && p.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      return [];
    });
  }, []);

  const getPendingFileForPath = useCallback(
    (filePath: string) => {
      if (!filePath) return undefined;
      return pendingFiles.find((p) => p.filePath === filePath);
    },
    [pendingFiles]
  );

  // Update token & persist
  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken.trim());
  }, []);

  const setRepo = useCallback((newRepo: string) => {
    setRepoState(newRepo);
    localStorage.setItem(STORAGE_KEYS.REPO, newRepo.trim());
  }, []);

  const setBranch = useCallback((newBranch: string) => {
    setBranchState(newBranch);
    localStorage.setItem(STORAGE_KEYS.BRANCH, newBranch.trim());
  }, []);

  // Verify token when changed
  useEffect(() => {
    let isCancelled = false;
    async function checkToken() {
      if (!token.trim()) {
        setUserProfile(null);
        setIsTokenValid(false);
        return;
      }
      setIsVerifyingToken(true);
      try {
        const profile = await verifyGitHubToken(token);
        if (!isCancelled) {
          setUserProfile(profile);
          setIsTokenValid(true);
        }
      } catch {
        if (!isCancelled) {
          setUserProfile(null);
          setIsTokenValid(false);
        }
      } finally {
        if (!isCancelled) {
          setIsVerifyingToken(false);
        }
      }
    }
    checkToken();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  // Fetch catalog & repo files
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch catalog
      const result = await fetchCatalogFromGitHub(repo, branch, token);
      setOriginalCatalog(JSON.parse(JSON.stringify(result.catalog)));
      setSha(result.sha);

      // Check if there is a local draft in localStorage
      const savedDraft = localStorage.getItem(STORAGE_KEYS.DRAFT);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Only use draft if it has valid structure
          if (parsed && Array.isArray(parsed.customArtists)) {
            setCatalog(parsed);
          } else {
            setCatalog(result.catalog);
          }
        } catch {
          setCatalog(result.catalog);
        }
      } else {
        setCatalog(result.catalog);
      }

      // Fetch repo tree in background for asset picker and storage view
      fetchRepoDetailedTree(repo, branch, token).then((items) => {
        if (items && items.length > 0) {
          setRepoFileItems(items);
          setRepoFiles(items.map((i) => i.path));
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки данных';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [repo, branch, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Persist draft whenever catalog changes
  useEffect(() => {
    if (catalog) {
      try {
        localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(catalog));
      } catch (e) {
        console.warn('LocalStorage quota exceeded for draft:', e);
      }
    }
  }, [catalog]);

  // Discard draft and revert to original
  const discardDraft = useCallback(() => {
    if (originalCatalog) {
      setCatalog(JSON.parse(JSON.stringify(originalCatalog)));
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    }
  }, [originalCatalog]);

  // Download catalog.json backup
  const downloadJson = useCallback(() => {
    if (!catalog) return;
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [catalog]);

  // Calculate Diff between original and draft
  const diffs = useMemo<DiffChange[]>(() => {
    if (!catalog || !originalCatalog) return [];
    const list: DiffChange[] = [];

    // Artists
    const origArtMap = new Map(originalCatalog.customArtists.map((a) => [a.id, a]));
    const curArtMap = new Map(catalog.customArtists.map((a) => [a.id, a]));

    catalog.customArtists.forEach((a) => {
      const orig = origArtMap.get(a.id);
      if (!orig) {
        list.push({ type: 'artist', action: 'added', title: a.name, id: a.id });
      } else if (JSON.stringify(orig) !== JSON.stringify(a)) {
        list.push({ type: 'artist', action: 'modified', title: a.name, id: a.id });
      }
    });
    originalCatalog.customArtists.forEach((a) => {
      if (!curArtMap.has(a.id)) {
        list.push({ type: 'artist', action: 'deleted', title: a.name, id: a.id });
      }
    });

    // Albums
    const origAlbMap = new Map(originalCatalog.customAlbums.map((a) => [a.id, a]));
    const curAlbMap = new Map(catalog.customAlbums.map((a) => [a.id, a]));

    catalog.customAlbums.forEach((a) => {
      const orig = origAlbMap.get(a.id);
      if (!orig) {
        list.push({ type: 'album', action: 'added', title: a.title, id: a.id });
      } else if (JSON.stringify(orig) !== JSON.stringify(a)) {
        list.push({ type: 'album', action: 'modified', title: a.title, id: a.id });
      }
    });
    originalCatalog.customAlbums.forEach((a) => {
      if (!curAlbMap.has(a.id)) {
        list.push({ type: 'album', action: 'deleted', title: a.title, id: a.id });
      }
    });

    // Tracks
    const origTrkMap = new Map(originalCatalog.customTracks.map((t) => [t.id, t]));
    const curTrkMap = new Map(catalog.customTracks.map((t) => [t.id, t]));

    catalog.customTracks.forEach((t) => {
      const orig = origTrkMap.get(t.id);
      if (!orig) {
        list.push({ type: 'track', action: 'added', title: t.title, id: t.id });
      } else if (JSON.stringify(orig) !== JSON.stringify(t)) {
        list.push({ type: 'track', action: 'modified', title: t.title, id: t.id });
      }
    });
    originalCatalog.customTracks.forEach((t) => {
      if (!curTrkMap.has(t.id)) {
        list.push({ type: 'track', action: 'deleted', title: t.title, id: t.id });
      }
    });

    // Check if the order of existing tracks was changed
    const origTrackOrder = originalCatalog.customTracks.map((t) => t.id).join(',');
    const curTrackOrder = catalog.customTracks.map((t) => t.id).join(',');
    if (origTrackOrder !== curTrackOrder) {
      list.push({
        type: 'track',
        action: 'modified',
        title: 'Порядок треков в каталоге',
        id: 'track_order',
      });
    }

    // Videos
    const origVidMap = new Map(originalCatalog.customVideos.map((v) => [v.id, v]));
    const curVidMap = new Map(catalog.customVideos.map((v) => [v.id, v]));

    catalog.customVideos.forEach((v) => {
      const orig = origVidMap.get(v.id);
      if (!orig) {
        list.push({ type: 'video', action: 'added', title: v.title, id: v.id });
      } else if (JSON.stringify(orig) !== JSON.stringify(v)) {
        list.push({ type: 'video', action: 'modified', title: v.title, id: v.id });
      }
    });
    originalCatalog.customVideos.forEach((v) => {
      if (!curVidMap.has(v.id)) {
        list.push({ type: 'video', action: 'deleted', title: v.title, id: v.id });
      }
    });

    // News
    const origNewsMap = new Map(originalCatalog.customNews.map((n) => [n.id, n]));
    const curNewsMap = new Map(catalog.customNews.map((n) => [n.id, n]));

    catalog.customNews.forEach((n) => {
      const orig = origNewsMap.get(n.id);
      if (!orig) {
        list.push({ type: 'news', action: 'added', title: n.title, id: n.id });
      } else if (JSON.stringify(orig) !== JSON.stringify(n)) {
        list.push({ type: 'news', action: 'modified', title: n.title, id: n.id });
      }
    });
    originalCatalog.customNews.forEach((n) => {
      if (!curNewsMap.has(n.id)) {
        list.push({ type: 'news', action: 'deleted', title: n.title, id: n.id });
      }
    });

    // Broadcasts
    if (
      JSON.stringify(originalCatalog.systemPushBroadcast) !== JSON.stringify(catalog.systemPushBroadcast) ||
      JSON.stringify(originalCatalog.tempBroadcast) !== JSON.stringify(catalog.tempBroadcast) ||
      JSON.stringify(originalCatalog.pinnedBroadcast) !== JSON.stringify(catalog.pinnedBroadcast)
    ) {
      list.push({ type: 'broadcast', action: 'modified', title: 'Пуш-оповещения', id: 'broadcasts' });
    }

    // Force update / WhatsNew
    if (
      JSON.stringify(originalCatalog.forceUpdate) !== JSON.stringify(catalog.forceUpdate) ||
      JSON.stringify(originalCatalog.whatsNew) !== JSON.stringify(catalog.whatsNew)
    ) {
      list.push({ type: 'setting', action: 'modified', title: 'Параметры обновления версии', id: 'version' });
    }

    // Pending Files to Upload
    pendingFiles.forEach((f) => {
      list.push({
        type: 'file',
        action: 'added',
        title: `Медиафайл: ${f.filePath}`,
        id: f.id,
        size: f.size,
      });
    });

    return list;
  }, [catalog, originalCatalog, pendingFiles]);

  const hasUnsavedChanges = diffs.length > 0;

  // Publish to GitHub (uploads pending files first, then commits catalog.json)
  const publishToGitHub = useCallback(
    async (
      commitMessage?: string,
      onProgress?: (status: string, current: number, total: number) => void
    ) => {
      if (!catalog) throw new Error('Каталог не загружен.');
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSaving(true);
      setError(null);
      const totalSteps = pendingFiles.length + 1;

      setPublishProgress({
        isActive: true,
        currentStep: 0,
        totalSteps,
        percentage: 0,
        stepTitle: pendingFiles.length > 0 ? 'Подготовка медиафайлов...' : 'Подготовка catalog.json...',
        currentFileName: pendingFiles[0]?.filePath,
      });

      try {
        // Step 1: Upload all pending files directly to GitHub repository
        if (pendingFiles.length > 0) {
          for (let i = 0; i < pendingFiles.length; i++) {
            if (controller.signal.aborted) {
              throw new DOMException('Upload aborted by user', 'AbortError');
            }

            const pf = pendingFiles[i];
            const msg = `Загрузка файла (${i + 1}/${pendingFiles.length}): ${pf.filePath}`;
            setSavingStatusText(msg);
            setPublishProgress({
              isActive: true,
              currentStep: i + 1,
              totalSteps,
              percentage: Math.round((i / totalSteps) * 100),
              stepTitle: `Загрузка медиафайла (${i + 1}/${pendingFiles.length})`,
              currentFileName: pf.filePath,
            });
            if (onProgress) onProgress(msg, i + 1, totalSteps);

            await uploadBinaryFileToGitHub({
              repo,
              branch,
              token,
              filePath: pf.filePath,
              base64Content: pf.base64Content,
              commitMessage: `Upload ${pf.filePath} via DarkMusic Studio`,
              signal: controller.signal,
            });

            // Keep repo file tree updated in memory
            setRepoFiles((prev) => (prev.includes(pf.filePath) ? prev : [pf.filePath, ...prev]));

            setPublishProgress({
              isActive: true,
              currentStep: i + 1,
              totalSteps,
              percentage: Math.round(((i + 1) / totalSteps) * 100),
              stepTitle: `Файл загружен: ${pf.filePath}`,
              currentFileName: pf.filePath,
            });
          }
        }

        if (controller.signal.aborted) {
          throw new DOMException('Upload aborted by user', 'AbortError');
        }

        // Step 2: Commit updated catalog.json
        const finalMsg = 'Публикация изменений в catalog.json...';
        setSavingStatusText(finalMsg);
        setPublishProgress({
          isActive: true,
          currentStep: totalSteps,
          totalSteps,
          percentage: 95,
          stepTitle: finalMsg,
          currentFileName: 'catalog.json',
        });
        if (onProgress) onProgress(finalMsg, totalSteps, totalSteps);

        const result = await commitCatalogToGitHub({
          repo,
          branch,
          token,
          catalog,
          sha,
          commitMessage,
          signal: controller.signal,
        });

        setPublishProgress({
          isActive: false,
          currentStep: totalSteps,
          totalSteps,
          percentage: 100,
          stepTitle: 'Успешно опубликовано!',
        });

        // Update baseline original catalog with published state
        setOriginalCatalog(JSON.parse(JSON.stringify(catalog)));
        setSha(result.commitSha);
        clearPendingFiles();
        localStorage.removeItem(STORAGE_KEYS.DRAFT);
        return result;
      } catch (err: unknown) {
        if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          const cancelMsg = 'Загрузка отменена пользователем. Все ваши правки сохранены в черновике.';
          setError(cancelMsg);
          setPublishProgress({
            isActive: false,
            currentStep: 0,
            totalSteps,
            percentage: 0,
            stepTitle: 'Загрузка отменена',
          });
          throw new Error(cancelMsg);
        }
        const msg = err instanceof Error ? err.message : 'Ошибка публикации в GitHub';
        setError(msg);
        setPublishProgress({
          isActive: false,
          currentStep: 0,
          totalSteps,
          percentage: 0,
          stepTitle: 'Ошибка загрузки',
        });
        throw err;
      } finally {
        setIsSaving(false);
        setSavingStatusText('');
        abortControllerRef.current = null;
      }
    },
    [catalog, repo, branch, token, sha, pendingFiles, clearPendingFiles]
  );

  // Send single-shot instant push notification directly to GitHub
  const sendInstantPushNotification = useCallback(
    async (title: string, message: string, imageFile?: string) => {
      if (!catalog) throw new Error('Каталог не загружен.');
      if (!token.trim()) throw new Error('Токен GitHub обязателен для рассылки Push-уведомлений.');

      const ts = Date.now();
      const pushId = `push_${ts}`;
      const newPush: SystemBroadcast = {
        id: pushId,
        title: title.trim() || '🎵 Dark Music',
        message: message.trim(),
        imageFile: imageFile?.trim() || 'logo.png',
        active: true,
        createdAt: ts,
        updatedAt: ts,
      };

      const updatedCatalog: CatalogRoot = {
        ...catalog,
        systemPushBroadcast: newPush,
        updatedAt: ts,
      };

      setCatalog(updatedCatalog);
      setIsSaving(true);
      setSavingStatusText('Отправка push-уведомления в репозиторий...');

      try {
        const result = await commitCatalogToGitHub({
          repo,
          branch,
          token,
          catalog: updatedCatalog,
          sha,
          commitMessage: `Push broadcast: "${newPush.title}" (${new Date().toLocaleTimeString('ru-RU')})`,
        });

        setOriginalCatalog(JSON.parse(JSON.stringify(updatedCatalog)));
        setSha(result.commitSha);
        localStorage.removeItem(STORAGE_KEYS.DRAFT);
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Ошибка отправки push-уведомления';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
        setSavingStatusText('');
      }
    },
    [catalog, token, repo, branch, sha]
  );

  // Upload file to GitHub
  const uploadFile = useCallback(
    async (filePath: string, base64Content: string, commitMessage?: string) => {
      const res = await uploadBinaryFileToGitHub({
        repo,
        branch,
        token,
        filePath,
        base64Content,
        commitMessage,
      });

      // Add to local repo files list and items
      setRepoFiles((prev) => (prev.includes(filePath) ? prev : [filePath, ...prev]));
      setRepoFileItems((prev) => {
        if (prev.some((i) => i.path === filePath)) return prev;
        return [{ path: filePath, sha: res.sha }, ...prev];
      });
      return res;
    },
    [repo, branch, token]
  );

  // Refresh repo file items
  const refreshRepoFiles = useCallback(async () => {
    try {
      const items = await fetchRepoDetailedTree(repo, branch, token);
      setRepoFileItems(items);
      setRepoFiles(items.map((i) => i.path));
    } catch (err) {
      console.warn('Failed to refresh repo files:', err);
    }
  }, [repo, branch, token]);

  // Delete file from GitHub repository
  const deleteFileFromRepo = useCallback(
    async (filePath: string, sha?: string) => {
      await deleteFileFromGitHub({
        repo,
        branch,
        token,
        filePath,
        sha,
        commitMessage: `Delete ${filePath} via DarkMusic Studio`,
      });

      // Remove from states
      setRepoFiles((prev) => prev.filter((p) => p !== filePath));
      setRepoFileItems((prev) => prev.filter((i) => i.path !== filePath));
      removePendingFile(filePath);
    },
    [repo, branch, token, removePendingFile]
  );

  // Detect usage of a file across artists, albums, tracks, videos, news, and broadcasts
  const getFileUsage = useCallback(
    (filePath: string): FileUsageInfo => {
      if (!catalog || !filePath) return { isUsed: false, usages: [] };
      const usages: FileUsageInfo['usages'] = [];
      const normalizedPath = filePath.trim();

      const getArtName = (artId: string) => {
        const art = catalog.customArtists.find((a) => a.id === artId);
        return art ? art.name : catalog.artistNames[artId] || artId;
      };

      // Check tracks audio & cover
      catalog.customTracks.forEach((t) => {
        if (t.filePath === normalizedPath) {
          usages.push({
            type: 'track',
            entityId: t.id,
            entityTitle: t.title,
            description: `Аудио трека «${t.title}» (${getArtName(t.artistId)})`,
          });
        }
        if (t.coverFile === normalizedPath) {
          usages.push({
            type: 'track',
            entityId: t.id,
            entityTitle: t.title,
            description: `Обложка трека «${t.title}»`,
          });
        }
      });

      // Check albums cover
      catalog.customAlbums.forEach((alb) => {
        if (alb.coverFile === normalizedPath) {
          usages.push({
            type: 'album',
            entityId: alb.id,
            entityTitle: alb.title,
            description: `Обложка релиза «${alb.title}» (${alb.type || 'Альбом'})`,
          });
        }
      });

      // Check artist avatars & banners
      catalog.customArtists.forEach((art) => {
        if (art.avatarFile === normalizedPath || catalog.avatars[art.id] === normalizedPath) {
          usages.push({
            type: 'artist_avatar',
            entityId: art.id,
            entityTitle: art.name,
            description: `Аватар артиста: ${art.name}`,
          });
        }
        if (art.bannerFile === normalizedPath || catalog.artistBanners[art.id] === normalizedPath) {
          usages.push({
            type: 'artist_banner',
            entityId: art.id,
            entityTitle: art.name,
            description: `Баннер артиста: ${art.name}`,
          });
        }
      });

      // Check news
      catalog.customNews.forEach((news) => {
        if (news.imageFile === normalizedPath) {
          usages.push({
            type: 'news',
            entityId: news.id,
            entityTitle: news.title,
            description: `Изображение в новости «${news.title}»`,
          });
        }
      });

      // Check videos
      catalog.customVideos.forEach((vid) => {
        if (vid.previewFile === normalizedPath) {
          usages.push({
            type: 'track',
            entityId: vid.id,
            entityTitle: vid.title,
            description: `Превью клипа «${vid.title}»`,
          });
        }
      });

      // Check broadcasts
      if (catalog.systemPushBroadcast?.imageFile === normalizedPath) {
        usages.push({
          type: 'broadcast',
          entityId: catalog.systemPushBroadcast.id,
          entityTitle: catalog.systemPushBroadcast.title || 'Push-рассылка',
          description: `Иконка/баннер Push-оповещения`,
        });
      }
      if (catalog.tempBroadcast?.imageFile === normalizedPath) {
        usages.push({
          type: 'broadcast',
          entityId: catalog.tempBroadcast.id,
          entityTitle: catalog.tempBroadcast.title || 'Временное оповещение',
          description: `Баннер временного оповещения`,
        });
      }
      if (catalog.pinnedBroadcast?.imageFile === normalizedPath) {
        usages.push({
          type: 'broadcast',
          entityId: catalog.pinnedBroadcast.id,
          entityTitle: catalog.pinnedBroadcast.title || 'Закрепленное оповещение',
          description: `Баннер закрепленного оповещения`,
        });
      }

      return {
        isUsed: usages.length > 0,
        usages,
      };
    },
    [catalog]
  );

  // CRUD Implementations
  const addArtist = useCallback((artist: ArtistRecord) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        customArtists: [artist, ...prev.customArtists],
      };
      return syncLegacyArtistDictionaries(next);
    });
  }, []);

  const updateArtist = useCallback((id: string, updates: Partial<ArtistRecord>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const nextArtists = prev.customArtists.map((a) => (a.id === id ? { ...a, ...updates } : a));
      const next = { ...prev, customArtists: nextArtists };
      return syncLegacyArtistDictionaries(next);
    });
  }, []);

  const deleteArtist = useCallback((id: string) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const nextArtists = prev.customArtists.filter((a) => a.id !== id);
      const curDeleted = prev.deletedCustomIds || [];
      const nextDeleted = curDeleted.includes(id) ? curDeleted : [...curDeleted, id];
      const next = { ...prev, customArtists: nextArtists, deletedCustomIds: nextDeleted };
      return syncLegacyArtistDictionaries(next);
    });
  }, []);

  const addAlbum = useCallback((album: AlbumRecord) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customAlbums: [album, ...prev.customAlbums],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateAlbum = useCallback((id: string, updates: Partial<AlbumRecord>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customAlbums: prev.customAlbums.map((alb) => (alb.id === id ? { ...alb, ...updates } : alb)),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const deleteAlbum = useCallback((id: string) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const curDeleted = prev.deletedCustomIds || [];
      const nextDeleted = curDeleted.includes(id) ? curDeleted : [...curDeleted, id];
      return {
        ...prev,
        customAlbums: prev.customAlbums.filter((a) => a.id !== id),
        deletedCustomIds: nextDeleted,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const addTrack = useCallback((track: TrackRecord) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customTracks: [track, ...prev.customTracks],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateTrack = useCallback((id: string, updates: Partial<TrackRecord>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customTracks: prev.customTracks.map((trk) => (trk.id === id ? { ...trk, ...updates } : trk)),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const deleteTrack = useCallback((id: string) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const curDeleted = prev.deletedCustomIds || [];
      const nextDeleted = curDeleted.includes(id) ? curDeleted : [...curDeleted, id];
      return {
        ...prev,
        customTracks: prev.customTracks.filter((t) => t.id !== id),
        deletedCustomIds: nextDeleted,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const reorderTracks = useCallback(
    (trackId: string, direction: 'up' | 'down', targetTrackId?: string) => {
      setCatalog((prev) => {
        if (!prev) return prev;
        const tracks = [...prev.customTracks];
        const fromIdx = tracks.findIndex((t) => t.id === trackId);
        if (fromIdx === -1) return prev;

        if (targetTrackId) {
          const toIdx = tracks.findIndex((t) => t.id === targetTrackId);
          if (toIdx === -1) return prev;

          const [moved] = tracks.splice(fromIdx, 1);
          tracks.splice(toIdx, 0, moved);
        } else {
          const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
          if (toIdx < 0 || toIdx >= tracks.length) return prev;

          const temp = tracks[fromIdx];
          tracks[fromIdx] = tracks[toIdx];
          tracks[toIdx] = temp;
        }

        return {
          ...prev,
          customTracks: tracks,
          updatedAt: Date.now(),
        };
      });
    },
    []
  );

  const addVideo = useCallback((video: VideoRecord) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customVideos: [video, ...prev.customVideos],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateVideo = useCallback((id: string, updates: Partial<VideoRecord>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customVideos: prev.customVideos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const deleteVideo = useCallback((id: string) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const curDeleted = prev.deletedCustomIds || [];
      const nextDeleted = curDeleted.includes(id) ? curDeleted : [...curDeleted, id];
      return {
        ...prev,
        customVideos: prev.customVideos.filter((v) => v.id !== id),
        deletedCustomIds: nextDeleted,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const addNews = useCallback((news: NewsRecord) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customNews: [news, ...prev.customNews],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateNews = useCallback((id: string, updates: Partial<NewsRecord>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customNews: prev.customNews.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const deleteNews = useCallback((id: string) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const curDeleted = prev.deletedCustomIds || [];
      const nextDeleted = curDeleted.includes(id) ? curDeleted : [...curDeleted, id];
      return {
        ...prev,
        customNews: prev.customNews.filter((n) => n.id !== id),
        deletedCustomIds: nextDeleted,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateBroadcast = useCallback(
    (key: 'systemPushBroadcast' | 'tempBroadcast' | 'pinnedBroadcast', data: Partial<SystemBroadcast>) => {
      setCatalog((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            ...data,
            updatedAt: Date.now(),
          },
          updatedAt: Date.now(),
        };
      });
    },
    []
  );

  const updateForceUpdate = useCallback((data: Partial<ForceUpdateConfig>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        forceUpdate: {
          ...prev.forceUpdate,
          ...data,
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateWhatsNew = useCallback((data: Partial<WhatsNewConfig>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        whatsNew: {
          ...prev.whatsNew,
          ...data,
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      };
    });
  }, []);

  return (
    <CatalogContext.Provider
      value={{
        catalog,
        originalCatalog,
        sha,
        isLoading,
        isSaving,
        savingStatusText,
        publishProgress,
        cancelPublish,
        error,
        token,
        repo,
        branch,
        userProfile,
        isTokenValid,
        isVerifyingToken,
        repoFiles,
        repoFileItems,
        diffs,
        hasUnsavedChanges,
        pendingFiles,
        addPendingFile,
        removePendingFile,
        clearPendingFiles,
        getPendingFileForPath,
        refreshRepoFiles,
        deleteFileFromRepo,
        getFileUsage,
        setToken,
        setRepo,
        setBranch,
        refreshCatalog: loadData,
        discardDraft,
        downloadJson,
        publishToGitHub,
        uploadFile,
        sendInstantPushNotification,
        addArtist,
        updateArtist,
        deleteArtist,
        addAlbum,
        updateAlbum,
        deleteAlbum,
        addTrack,
        updateTrack,
        deleteTrack,
        reorderTracks,
        addVideo,
        updateVideo,
        deleteVideo,
        addNews,
        updateNews,
        deleteNews,
        updateBroadcast,
        updateForceUpdate,
        updateWhatsNew,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
