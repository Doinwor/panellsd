/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CatalogProvider, useCatalog } from './context/CatalogContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AuthProvider } from './context/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import { Header } from './components/Header';
import { AudioPlayer } from './components/AudioPlayer';

// Views
import { OverviewView } from './components/views/OverviewView';
import { ArtistsView } from './components/views/ArtistsView';
import { AlbumsView } from './components/views/AlbumsView';
import { TracksView } from './components/views/TracksView';
import { VideosView } from './components/views/VideosView';
import { NewsView } from './components/views/NewsView';
import { BroadcastsView } from './components/views/BroadcastsView';
import { StorageView } from './components/views/StorageView';
import { SettingsView } from './components/views/SettingsView';

// Modals
import { PublishModal } from './components/modals/PublishModal';
import { UploadFileModal } from './components/modals/UploadFileModal';
import { ArtistModal } from './components/modals/ArtistModal';
import { AlbumModal } from './components/modals/AlbumModal';
import { TrackModal } from './components/modals/TrackModal';
import { VideoModal } from './components/modals/VideoModal';
import { NewsModal } from './components/modals/NewsModal';
import { GitHubSyncModal } from './components/modals/GitHubSyncModal';

import { ArtistRecord, AlbumRecord, TrackRecord, VideoRecord, NewsRecord } from './types/catalog';
import { AlertCircle, RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { catalog, isLoading, error, refreshCatalog, hasUnsavedChanges, token } = useCatalog();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Prevent accidental tab closure when uncommitted changes exist
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // GitHub Sync credentials modal
  const [isGitHubSyncModalOpen, setIsGitHubSyncModalOpen] = useState(false);

  // If no token exists in localStorage, prompt user upon entering the app
  React.useEffect(() => {
    if (!token && !localStorage.getItem('darkmusic_github_token')) {
      setIsGitHubSyncModalOpen(true);
    }
  }, [token]);

  // Modals state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalFolder, setUploadModalFolder] = useState<'tracks' | 'covers' | 'avatars' | 'banners'>('covers');
  const [uploadModalArtistId, setUploadModalArtistId] = useState<string>('mc_ezdit');
  const [uploadCallback, setUploadCallback] = useState<((path: string, duration?: string) => void) | null>(null);

  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artistToEdit, setArtistToEdit] = useState<ArtistRecord | null>(null);

  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState<AlbumRecord | null>(null);

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackToEdit, setTrackToEdit] = useState<TrackRecord | null>(null);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState<VideoRecord | null>(null);

  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState<NewsRecord | null>(null);

  // Helper to open upload modal from another modal
  const handleOpenUploadForField = (
    folder: 'tracks' | 'covers' | 'avatars' | 'banners',
    cb: (path: string, duration?: string) => void,
    artistId?: string
  ) => {
    setUploadModalFolder(folder);
    if (artistId) setUploadModalArtistId(artistId);
    setUploadCallback(() => cb);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-28 selection:bg-purple-500 selection:text-white relative overflow-x-hidden">
      {/* Background cyber grid & neon stripes overlay (matching AuthGate aesthetic) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient neon orbs */}
        <div className="absolute w-[650px] h-[650px] rounded-full bg-purple-600/[0.08] blur-[150px] -top-32 -left-32 animate-pulse" />
        <div className="absolute w-[550px] h-[550px] rounded-full bg-emerald-500/[0.06] blur-[160px] top-1/3 -right-32 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600/[0.07] blur-[160px] -bottom-32 left-1/4 animate-pulse" />

        {/* Cyber grid lines */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Diagonal striped scanlines pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 18px)`,
          }}
        />
      </div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        onOpenUploadModal={() => {
          setUploadCallback(null);
          setUploadModalFolder('covers');
          setIsUploadModalOpen(true);
        }}
        onOpenGitHubSync={() => setIsGitHubSyncModalOpen(true)}
      />

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {isLoading && !catalog ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-400">Загрузка каталога из репозитория GitHub...</p>
          </div>
        ) : error && !catalog ? (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-zinc-900 border border-rose-500/30 text-center space-y-4 my-12">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Не удалось загрузить каталог</h3>
              <p className="text-xs text-rose-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => refreshCatalog()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewView
                setActiveTab={setActiveTab}
                onOpenArtistModal={() => {
                  setArtistToEdit(null);
                  setIsArtistModalOpen(true);
                }}
                onOpenAlbumModal={() => {
                  setAlbumToEdit(null);
                  setIsAlbumModalOpen(true);
                }}
                onOpenTrackModal={() => {
                  setTrackToEdit(null);
                  setIsTrackModalOpen(true);
                }}
                onOpenPublishModal={() => setIsPublishModalOpen(true)}
              />
            )}

            {activeTab === 'artists' && (
              <ArtistsView
                onOpenAddArtist={() => {
                  setArtistToEdit(null);
                  setIsArtistModalOpen(true);
                }}
                onEditArtist={(art) => {
                  setArtistToEdit(art);
                  setIsArtistModalOpen(true);
                }}
              />
            )}

            {activeTab === 'albums' && (
              <AlbumsView
                onOpenAddAlbum={() => {
                  setAlbumToEdit(null);
                  setIsAlbumModalOpen(true);
                }}
                onEditAlbum={(alb) => {
                  setAlbumToEdit(alb);
                  setIsAlbumModalOpen(true);
                }}
              />
            )}

            {activeTab === 'tracks' && (
              <TracksView
                onOpenAddTrack={() => {
                  setTrackToEdit(null);
                  setIsTrackModalOpen(true);
                }}
                onEditTrack={(trk) => {
                  setTrackToEdit(trk);
                  setIsTrackModalOpen(true);
                }}
              />
            )}

            {activeTab === 'videos' && (
              <VideosView
                onOpenAddVideo={() => {
                  setVideoToEdit(null);
                  setIsVideoModalOpen(true);
                }}
                onEditVideo={(vid) => {
                  setVideoToEdit(vid);
                  setIsVideoModalOpen(true);
                }}
              />
            )}

            {activeTab === 'news' && (
              <NewsView
                onOpenAddNews={() => {
                  setNewsToEdit(null);
                  setIsNewsModalOpen(true);
                }}
                onEditNews={(n) => {
                  setNewsToEdit(n);
                  setIsNewsModalOpen(true);
                }}
              />
            )}

            {activeTab === 'broadcasts' && <BroadcastsView />}

            {activeTab === 'storage' && <StorageView />}

            {activeTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* Bottom Audio Player */}
      <AudioPlayer />

      {/* Modals */}
      <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} />

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultFolder={uploadModalFolder}
        artistId={uploadModalArtistId}
        onFileUploaded={(path, dur) => {
          if (uploadCallback) {
            uploadCallback(path, dur);
          }
        }}
      />

      <ArtistModal
        isOpen={isArtistModalOpen}
        onClose={() => setIsArtistModalOpen(false)}
        artistToEdit={artistToEdit}
      />

      <AlbumModal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        albumToEdit={albumToEdit}
      />

      <TrackModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        trackToEdit={trackToEdit}
      />

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoToEdit={videoToEdit}
      />

      <NewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        newsToEdit={newsToEdit}
      />

      <GitHubSyncModal
        isOpen={isGitHubSyncModalOpen}
        onClose={() => setIsGitHubSyncModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <CatalogProvider>
          <AudioPlayerProvider>
            <AppContent />
          </AudioPlayerProvider>
        </CatalogProvider>
      </AuthGate>
    </AuthProvider>
  );
}
