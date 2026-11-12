import React, { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { Key, GitBranch, Github, ShieldCheck, AlertCircle, Eye, EyeOff, Check, RotateCcw } from 'lucide-react';
import { DEFAULT_REPO, DEFAULT_BRANCH, DEFAULT_TOKEN } from '../../services/githubApi';

export const SettingsView: React.FC = () => {
  const {
    token,
    repo,
    branch,
    setToken,
    setRepo,
    setBranch,
    userProfile,
    isTokenValid,
    isVerifyingToken,
    refreshCatalog,
    isLoading,
  } = useCatalog();

  const [inputToken, setInputToken] = useState(token);
  const [inputRepo, setInputRepo] = useState(repo);
  const [inputBranch, setInputBranch] = useState(branch);
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setToken(inputToken.trim());
    setRepo(inputRepo.trim());
    setBranch(inputBranch.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    setInputToken('');
    setInputRepo(DEFAULT_REPO);
    setInputBranch(DEFAULT_BRANCH);
    setToken('');
    setRepo(DEFAULT_REPO);
    setBranch(DEFAULT_BRANCH);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>Настройки GitHub и Синхронизации</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Конфигурация репозитория, токена доступа и проверка авторизации для коммитов в GitHub
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {userProfile ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.login}
                className="w-12 h-12 rounded-full border-2 border-emerald-500/40 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                <Github className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  {userProfile ? userProfile.name || userProfile.login : 'Не авторизован'}
                </span>
                {isTokenValid && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Подключено
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {userProfile ? `@${userProfile.login}` : 'Токен не указан или недействителен'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshCatalog()}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Проверка...' : 'Проверить связь с репозиторием'}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 space-y-5 shadow-xl">
        {/* Token Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-purple-400" />
            <span>GitHub Personal Access Token (токен доступа)</span>
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full pr-10 pl-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
            Токен с правами <code>repo</code> позволяет приложению загружать и публиковать <code>catalog.json</code>,
            а также загружать mp3 треки и обложки. Токен сохраняется в локальном хранилище вашего браузера.
          </p>
        </div>

        {/* Repository & Branch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-zinc-400" />
              <span>Репозиторий (Owner/Repo)</span>
            </label>
            <input
              type="text"
              value={inputRepo}
              onChange={(e) => setInputRepo(e.target.value)}
              placeholder="EzzO4ka/darkmusic"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ветка (Branch)</span>
            </label>
            <input
              type="text"
              value={inputBranch}
              onChange={(e) => setInputBranch(e.target.value)}
              placeholder="main"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Status Alert */}
        {isVerifyingToken ? (
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span>Проверка токена через GitHub API...</span>
          </div>
        ) : isTokenValid ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Токен подтверждён! Доступ к репозиторию <b>{repo}</b> активен.</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Токен не прошёл валидацию. Проверьте правильность введённого ключа.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Сбросить к значениям по умолчанию
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Настройки сохранены!</span>
              </>
            ) : (
              <span>Сохранить настройки</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
