import { CatalogRoot, GitHubUserProfile, RepoFileItem } from '../types/catalog';

export const DEFAULT_REPO = 'EzzO4ka/darkmusic';
export const DEFAULT_BRANCH = 'main';
export const DEFAULT_TOKEN = '';

// Safe UTF-8 Base64 Encoder / Decoder for Russian strings
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUtf8(b64: string): string {
  // Strip newlines that GitHub API may include in base64 strings
  const cleanB64 = b64.replace(/\s/g, '');
  const binary = atob(cleanB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function verifyGitHubToken(token: string): Promise<GitHubUserProfile> {
  const clean = token.trim();
  if (!clean) {
    throw new Error('Токен GitHub не указан.');
  }

  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${clean}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'DarkMusicStudio/1.0',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Неверный или просроченный токен GitHub.');
    }
    throw new Error(`Ошибка проверки токена: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function fetchCatalogFromGitHub(
  repo: string = DEFAULT_REPO,
  branch: string = DEFAULT_BRANCH,
  token?: string
): Promise<{ catalog: CatalogRoot; sha: string; source: 'github_api' | 'github_raw' | 'local_fallback' }> {
  const cleanToken = token?.trim();

  // 1. Try GitHub Contents API if token is provided
  if (cleanToken) {
    try {
      const url = `https://api.github.com/repos/${repo}/contents/catalog.json?ref=${encodeURIComponent(branch)}&_cb=${Date.now()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DarkMusicStudio/1.0',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const jsonText = base64ToUtf8(data.content);
        const catalog: CatalogRoot = JSON.parse(jsonText);
        return { catalog, sha: data.sha, source: 'github_api' };
      }
    } catch (e) {
      console.warn('GitHub Contents API fetch failed, trying raw:', e);
    }
  }

  // 2. Try raw.githubusercontent.com
  try {
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/catalog.json?_cb=${Date.now()}`;
    const rawRes = await fetch(rawUrl, { cache: 'no-store' });
    if (rawRes.ok) {
      const catalog: CatalogRoot = await rawRes.json();
      return { catalog, sha: '', source: 'github_raw' };
    }
  } catch (e) {
    console.warn('Raw GitHub fetch failed, trying local fallback:', e);
  }

  // 3. Fallback to local /catalog.json
  const localRes = await fetch(`/catalog.json?_cb=${Date.now()}`, { cache: 'no-store' });
  if (localRes.ok) {
    const catalog: CatalogRoot = await localRes.json();
    return { catalog, sha: '', source: 'local_fallback' };
  }

  throw new Error('Не удалось загрузить catalog.json ни из GitHub, ни локально.');
}

export async function fetchFileSha(
  repo: string,
  filePath: string,
  branch: string,
  token: string,
  signal?: AbortSignal
): Promise<string> {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'DarkMusicStudio/1.0',
    },
    signal,
  });

  if (res.ok) {
    const data = await res.json();
    return data.sha || '';
  }
  return '';
}

export async function commitCatalogToGitHub(params: {
  repo: string;
  branch: string;
  token: string;
  catalog: CatalogRoot;
  sha?: string;
  commitMessage?: string;
  signal?: AbortSignal;
}): Promise<{ commitSha: string; commitUrl: string }> {
  const { repo, branch, token, catalog, commitMessage, signal } = params;
  let sha = params.sha;

  if (!token.trim()) {
    throw new Error('Токен GitHub обязателен для публикации изменений.');
  }

  // If sha is missing or empty, fetch the latest sha to avoid 409 conflict
  if (!sha) {
    sha = await fetchFileSha(repo, 'catalog.json', branch, token, signal);
  }

  // Format JSON beautifully with 2 spaces indent
  const formattedJson = JSON.stringify(catalog, null, 2);
  const base64Content = utf8ToBase64(formattedJson);

  const url = `https://api.github.com/repos/${repo}/contents/catalog.json`;
  const body: Record<string, unknown> = {
    message: commitMessage || `Update catalog.json via DarkMusic Studio (${new Date().toLocaleString('ru-RU')})`,
    content: base64Content,
    branch: branch || 'main',
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DarkMusicStudio/1.0',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    if (response.status === 409) {
      // Automatic fresh SHA resolution and 1 retry to resolve simultaneous branch commits
      try {
        const freshSha = await fetchFileSha(repo, 'catalog.json', branch, token, signal);
        if (freshSha) {
          body.sha = freshSha;
          const retryRes = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token.trim()}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'DarkMusicStudio/1.0',
            },
            body: JSON.stringify(body),
            signal,
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            return {
              commitSha: retryData.commit?.sha || '',
              commitUrl: retryData.commit?.html_url || `https://github.com/${repo}/commits/${branch}`,
            };
          }
        }
      } catch (retryErr) {
        console.warn('Auto-retry on 409 failed:', retryErr);
      }

      throw new Error(
        'Конфликт версий (409 Conflict): catalog.json был изменён в GitHub параллельно. Пожалуйста, нажмите «Обновить с GitHub» и повторите коммит.'
      );
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Ошибка публикации: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    commitSha: data.commit?.sha || '',
    commitUrl: data.commit?.html_url || `https://github.com/${repo}/commits/${branch}`,
  };
}

export async function uploadBinaryFileToGitHub(params: {
  repo: string;
  branch: string;
  token: string;
  filePath: string; // e.g. "tracks/mc_ezdit/track.mp3" or "covers/alb_new.jpg"
  base64Content: string;
  commitMessage?: string;
  signal?: AbortSignal;
}): Promise<{ fileUrl: string; sha: string }> {
  const { repo, branch, token, filePath, base64Content, commitMessage, signal } = params;

  if (!token.trim()) {
    throw new Error('Токен GitHub обязателен для загрузки файлов.');
  }

  // Check if file already exists to get sha for overwrite
  const existingSha = await fetchFileSha(repo, filePath, branch, token, signal);

  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const body: Record<string, unknown> = {
    message: commitMessage || `Upload ${filePath} via DarkMusic Studio`,
    content: base64Content,
    branch: branch || 'main',
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DarkMusicStudio/1.0',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Ошибка загрузки файла ${filePath}: ${response.status}`);
  }

  const data = await response.json();
  return {
    fileUrl: `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`,
    sha: data.content?.sha || '',
  };
}

export async function fetchRepoDetailedTree(
  repo: string = DEFAULT_REPO,
  branch: string = DEFAULT_BRANCH,
  token?: string
): Promise<RepoFileItem[]> {
  try {
    const url = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'DarkMusicStudio/1.0',
    };
    if (token?.trim()) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tree)) {
        return data.tree
          .filter((item: { type: string; path: string }) => item.type === 'blob')
          .map((item: { path: string; sha: string; size?: number }) => ({
            path: item.path,
            sha: item.sha,
            size: item.size,
          }));
      }
    }
  } catch (err) {
    console.warn('Failed to fetch detailed repo file tree:', err);
  }
  return [];
}

export async function fetchRepoFileTree(
  repo: string = DEFAULT_REPO,
  branch: string = DEFAULT_BRANCH,
  token?: string
): Promise<string[]> {
  const items = await fetchRepoDetailedTree(repo, branch, token);
  return items.map((i) => i.path);
}

export async function deleteFileFromGitHub(params: {
  repo: string;
  branch: string;
  token: string;
  filePath: string;
  sha?: string;
  commitMessage?: string;
}): Promise<void> {
  const { repo, branch, token, filePath, commitMessage } = params;
  let sha = params.sha;

  if (!token.trim()) {
    throw new Error('Токен GitHub обязателен для удаления файлов.');
  }

  if (!sha) {
    sha = await fetchFileSha(repo, filePath, branch, token);
    if (!sha) {
      throw new Error(`Не удалось определить sha для файла ${filePath}. Возможно, он уже удален.`);
    }
  }

  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DarkMusicStudio/1.0',
    },
    body: JSON.stringify({
      message: commitMessage || `Delete ${filePath} via DarkMusic Studio`,
      sha,
      branch: branch || 'main',
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Ошибка удаления файла ${filePath}: ${response.status}`);
  }
}
