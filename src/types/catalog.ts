export interface ArtistRecord {
  id: string;
  name: string;
  role: string;
  gradient: string;
  icon: string;
  avatarFile: string;
  bannerFile?: string;
  bio: string;
  facts: string[];
  isCustom?: boolean;
  createdAt?: number;
}

export interface AlbumRecord {
  id: string;
  title: string;
  artistId: string;
  featArtistId?: string;
  type: 'АЛЬБОМ' | 'СИНГЛ' | 'EP' | string;
  year: number;
  coverFile: string;
  gradient: string;
  isExplicit: boolean;
}

export interface TrackRecord {
  id: string;
  title: string;
  artistId: string;
  featArtistId?: string;
  albumId: string;
  filePath: string;
  coverFile: string;
  duration: string;
  year: number;
  isNew: boolean;
  isExplicit: boolean;
  createdAt: number;
}

export interface VideoRecord {
  id: string;
  title: string;
  artistId: string;
  featArtistId?: string;
  year: number;
  previewFile: string;
  videoSource: string;
  duration: string;
  isExplicit: boolean;
  createdAt: number;
}

export interface NewsRecord {
  id: string;
  title: string;
  targetId: string; // 'app' or artistId
  dateText: string;
  imageFile: string;
  content: string;
  createdAt: number;
}

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  imageFile?: string;
  active: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface ForceUpdateConfig {
  active: boolean;
  requiredVersion: number;
  blockedVersions: number[];
  downloadUrl: string;
  message: string;
  updatedAt: number;
}

export interface WhatsNewConfig {
  id: string;
  title: string;
  content: string;
  version: number;
  active: boolean;
  updatedAt: number;
}

export interface CatalogRoot {
  githubRepoPath: string;
  githubBranch: string;
  avatars: Record<string, string>;
  artistBanners: Record<string, string>;
  artistNames: Record<string, string>;
  artistBios: Record<string, string>;
  artistRoles: Record<string, string>;
  artistFacts: Record<string, string[]>;
  artistGradients: Record<string, string>;
  artistIcons: Record<string, string>;
  customArtists: ArtistRecord[];
  customAlbums: AlbumRecord[];
  customTracks: TrackRecord[];
  customVideos: VideoRecord[];
  customNews: NewsRecord[];
  deletedCustomIds: string[];
  systemPushBroadcast: SystemBroadcast;
  tempBroadcast: SystemBroadcast;
  pinnedBroadcast: SystemBroadcast;
  forceUpdate: ForceUpdateConfig;
  whatsNew: WhatsNewConfig;
  updatedAt: number;
}

export interface GitHubUserProfile {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

export interface DiffChange {
  type: 'artist' | 'album' | 'track' | 'video' | 'news' | 'broadcast' | 'setting' | 'file';
  action: 'added' | 'modified' | 'deleted';
  title: string;
  id: string;
  size?: number;
}

export interface PendingFileUpload {
  id: string;
  filePath: string;
  file: File;
  base64Content: string;
  size: number;
  previewUrl: string;
  duration?: string;
  category: 'tracks' | 'covers' | 'avatars' | 'banners';
}

export interface PublishProgressState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  stepTitle: string;
  currentFileName?: string;
}

export interface RepoFileItem {
  path: string;
  sha: string;
  size?: number;
}

export interface FileUsageInfo {
  isUsed: boolean;
  usages: {
    type: 'track' | 'album' | 'artist_avatar' | 'artist_banner' | 'news' | 'broadcast';
    entityId: string;
    entityTitle: string;
    description: string;
  }[];
}

