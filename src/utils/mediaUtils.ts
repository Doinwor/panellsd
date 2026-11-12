import { DEFAULT_REPO, DEFAULT_BRANCH } from '../services/githubApi';
import { PendingFileUpload } from '../types/catalog';

/**
 * Resolves a media file path to either a local staged blob URL (if pending upload)
 * or to the public GitHub raw URL.
 */
export function resolveMediaUrl(
  filePath: string | undefined | null,
  getPendingFileForPath?: (path: string) => PendingFileUpload | undefined
): string {
  if (!filePath || !filePath.trim()) {
    return '';
  }

  const clean = filePath.trim();

  // If already a full URL or blob URL
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('data:')) {
    return clean;
  }

  // 1. Check if staged locally in pending files
  if (getPendingFileForPath) {
    const staged = getPendingFileForPath(clean);
    if (staged?.previewUrl) {
      return staged.previewUrl;
    }
  }

  // 2. Format GitHub raw URL
  return `https://raw.githubusercontent.com/${DEFAULT_REPO}/${DEFAULT_BRANCH}/${encodeURI(clean)}`;
}
