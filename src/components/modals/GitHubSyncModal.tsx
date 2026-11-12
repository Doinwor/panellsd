import React, { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { verifyGitHubToken, DEFAULT_REPO, DEFAULT_BRANCH } from '../../services/githubApi';
import {
  Github,
  KeyRound,
  GitBranch,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { GitHubUserProfile } from '../../types/catalog';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  canDismiss?: boolean;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  canDismiss = true,
}) => {
  const { token, repo, branch, setToken, setRepo, setBranch, refreshCatalog } = useCatalog();

  const [inputToken, setInputToken] = useState<string>(token || '');
  const [inputRepo, setInputRepo] = useState<string>(repo || DEFAULT_REPO);
  const [inputBranch, setInputBranch] = useState<string>(branch || DEFAULT_BRANCH);
  const [showToken, setShowToken] = useState<boolean>(false);

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedProfile, setVerifiedProfile] = useState<GitHubUserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVerifyAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanToken = inputToken.trim();
    const cleanRepo = inputRepo.trim();
    const cleanBranch = inputBranch.trim() || 'main';

    if (!cleanToken) {
      setError('Пожалуйста, введите персональный токен доступа GitHub (PAT).');
      return;
    }
    if (!cleanRepo || !cleanRepo.includes('/')) {
      setError('Укажите репозиторий в формате «владелец/репозиторий», например: EzzO4ka/darkmusic');
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Verify token with GitHub API
      const profile = await verifyGitHubToken(cleanToken);
      setVerifiedProfile(profile);

      // 2. Save credentials to localStorage via CatalogContext
      setToken(cleanToken);
      setRepo(cleanRepo);
      setBranch(cleanBranch);

      setSuccess(true);

      // 3. Trigger immediate fresh sync from GitHub
      await refreshCatalog();

      // Close modal smoothly after brief success indication
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось подключиться к GitHub с указанным токеном.';
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Подключение к GitHub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  Синхронизация
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Введите персональный токен доступа для чтения и публикации изменений
              </p>
            </div>
          </div>

          {canDismiss && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleVerifyAndSync} className="p-6 space-y-4">
          {/* Security Banner */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Токен хранится <b className="text-zinc-200">исключительно в вашем браузере</b> (localStorage). В файлах проекта токен отсутствует.
            </p>
          </div>

          {/* GitHub Token Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>GitHub Personal Access Token (PAT) *</span>
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <span>Создать токен</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full pl-3 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">
              Требуется разрешение <code className="text-purple-300 font-mono">repo</code> для чтения каталога и отправки коммитов.
            </p>
          </div>

          {/* Repository & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Репозиторий *</span>
              </label>
              <input
                type="text"
                required
                value={inputRepo}
                onChange={(e) => setInputRepo(e.target.value)}
                placeholder="EzzO4ka/darkmusic"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ветка</span>
              </label>
              <input
                type="text"
                required
                value={inputBranch}
                onChange={(e) => setInputBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Verified Profile Card */}
          {verifiedProfile && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-fade-in">
              <img
                src={verifiedProfile.avatar_url}
                alt={verifiedProfile.login}
                className="w-10 h-10 rounded-full border border-emerald-500/50"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-emerald-200 truncate">
                    {verifiedProfile.name || verifiedProfile.login}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">@{verifiedProfile.login}</span>
                </div>
                <p className="text-[10px] text-emerald-300/80 mt-0.5">
                  Токен проверен и активен! Синхронизация данных...
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            {canDismiss ? (
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Отмена
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Войти без токена
              </button>
            )}

            <button
              type="submit"
              disabled={isVerifying || success}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Проверка токена...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Синхронизировано!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Синхронизировать с GitHub</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
