import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { TrackRecord } from '../types/catalog';
import { DEFAULT_REPO, DEFAULT_BRANCH } from '../services/githubApi';
import { useCatalog } from './CatalogContext';

interface AudioPlayerContextType {
  currentTrack: TrackRecord | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playTrack: (track: TrackRecord, customUrl?: string, playlist?: TrackRecord[]) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  audioUrl: string;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  hasNextTrack: boolean;
  hasPrevTrack: boolean;
  isCurrentTrackPending: boolean;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { catalog, getPendingFileForPath } = useCatalog();

  const [currentTrack, setCurrentTrack] = useState<TrackRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [activePlaylist, setActivePlaylist] = useState<TrackRecord[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Checks if the current playing track is a local staged draft
  const isCurrentTrackPending = Boolean(
    currentTrack?.filePath && getPendingFileForPath(currentTrack.filePath)
  );

  // Compute active audio URL (supports local blob: preview URLs for uncommitted tracks)
  const resolveAudioUrl = useCallback(
    (track: TrackRecord, customUrl?: string): string => {
      if (customUrl) return customUrl;

      // 1. Check if the file is staged in pending upload queue
      const staged = getPendingFileForPath(track.filePath);
      if (staged?.previewUrl) {
        return staged.previewUrl;
      }

      // 2. Fall back to GitHub raw URL
      return `https://raw.githubusercontent.com/${DEFAULT_REPO}/${DEFAULT_BRANCH}/${encodeURI(track.filePath)}`;
    },
    [getPendingFileForPath]
  );

  // Playlist list fallback: if activePlaylist is not set, use catalog.customTracks
  const trackList = activePlaylist.length > 0 ? activePlaylist : catalog?.customTracks || [];

  const currentTrackIndex = currentTrack
    ? trackList.findIndex((t) => t.id === currentTrack.id)
    : -1;

  const hasNextTrack = currentTrackIndex !== -1 && currentTrackIndex < trackList.length - 1;
  const hasPrevTrack = currentTrackIndex > 0;

  // Play next track
  const playNextTrack = useCallback(() => {
    if (currentTrackIndex !== -1 && currentTrackIndex < trackList.length - 1) {
      const next = trackList[currentTrackIndex + 1];
      if (next) {
        playTrack(next);
      }
    }
  }, [currentTrackIndex, trackList]);

  // Play previous track
  const playPrevTrack = useCallback(() => {
    if (currentTrackIndex > 0) {
      const prev = trackList[currentTrackIndex - 1];
      if (prev) {
        playTrack(prev);
      }
    }
  }, [currentTrackIndex, trackList]);

  const playTrack = useCallback(
    (track: TrackRecord, customUrl?: string, playlist?: TrackRecord[]) => {
      if (!audioRef.current) return;
      setCurrentTrack(track);
      if (playlist && playlist.length > 0) {
        setActivePlaylist(playlist);
      }

      const url = resolveAudioUrl(track, customUrl);
      setActiveUrl(url);

      audioRef.current.src = url;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Play was interrupted or failed:', err);
          setIsPlaying(false);
        });
    },
    [resolveAudioUrl]
  );

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      // Auto-advance to next track if available
      if (currentTrackIndex !== -1 && currentTrackIndex < trackList.length - 1) {
        playNextTrack();
      } else {
        setIsPlaying(false);
      }
    };
    const onError = (e: Event) => {
      console.warn('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentTrackIndex, trackList, playNextTrack, volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Resume failed:', err);
          setIsPlaying(false);
        });
    }
  }, [isPlaying, currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const audioUrl = activeUrl || (currentTrack ? resolveAudioUrl(currentTrack) : '');

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playTrack,
        togglePlay,
        pause,
        seek,
        setVolume,
        audioUrl,
        playNextTrack,
        playPrevTrack,
        hasNextTrack,
        hasPrevTrack,
        isCurrentTrackPending,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
