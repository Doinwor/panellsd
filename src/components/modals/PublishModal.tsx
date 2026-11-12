import React, { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { X, UploadCloud, CheckCircle2, AlertTriangle, ExternalLink, RotateCcw, FileAudio, ImageIcon, Ban, Loader2 } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose }) => {
  const {
    diffs,
    hasUnsavedChanges,
    pendingFiles,
    publishToGitHub,
    isSaving,
    savingStatusText,
    publishProgress,
    cancelPublish,
    error,
    token,
    repo,
    branch,
    userProfile,
    discardDraft,
    clearPendingFiles,
  } = useCatalog();

  const [commitMessage, setCommitMessage] = useState<string>(
    `Update catalog & media via DarkMusic Studio (${new Date().toLocaleDateString('ru-RU')})`
  );
  const [successResult, setSuccessResult] = useState<{ commitSha: string; commitUrl: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setActionError(null);
    try {
      const res = await publishToGitHub(commitMessage);
      setSuccessResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось опубликовать изменения.';
      setActionError(msg);
    }
  };

  const handleDiscard = () => {
    if (
      window.confirm(
        'Вы действительно хотите отменить все несохранённые изменения и загруженные локально файлы?'
      )
    ) {
      discardDraft();
      clearPendingFiles();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Публикация в GitHub</h3>
              <p className="text-xs text-zinc-400">
                Репозиторий {repo} • ветка {branch}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {successResult ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-100">Успешно опубликовано!</h4>
                <p className="text-sm text-zinc-400 mt-1">
                  Все выбранные файлы и обновлённый <code>catalog.json</code> успешно отправлены в GitHub.
                </p>
              </div>

              {successResult.commitUrl && (
                <a
                  href={successResult.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 transition-colors"
                >
                  <span>Посмотреть коммит на GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs rounded-xl transition-colors"
                >
                  Отлично, закрыть
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Token verification notice */}
              {userProfile ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.login}
                      className="w-6 h-6 rounded-full border border-zinc-700"
                    />
                    <span className="text-zinc-300">
                      Автор: <b className="text-zinc-100">{userProfile.name || userProfile.login}</b> (
                      @{userProfile.login})
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">Токен активен ✓</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Внимание: токен GitHub не настроен или недействителен. Укажите его в Настройках.</span>
                </div>
              )}

              {/* Pending Files to upload */}
              {pendingFiles.length > 0 && (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-purple-400" />
                      Файлы к отправке в репозиторий ({pendingFiles.length})
                    </span>
                    <span className="text-[11px] font-mono text-purple-300">
                      {(
                        pendingFiles.reduce((acc, curr) => acc + curr.size, 0) /
                        1024 /
                        1024
                      ).toFixed(2)}{' '}
                      MB всего
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {pendingFiles.map((pf) => (
                      <div
                        key={pf.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {pf.category === 'tracks' ? (
                            <FileAudio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          )}
                          <span className="text-zinc-200 font-mono text-[11px] truncate">
                            {pf.filePath}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">
                          {(pf.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commit message input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Сообщение коммита (Commit Message):
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Опишите ваши изменения..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Diff list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    Сводка изменений ({diffs.length}):
                  </span>
                  {hasUnsavedChanges && (
                    <button
                      onClick={handleDiscard}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Сбросить все правки
                    </button>
                  )}
                </div>

                {diffs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center text-xs text-zinc-500">
                    Нет изменений по сравнению с версией на GitHub.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                    {diffs.map((d, idx) => {
                      let badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                      let actionText = 'изменено';
                      if (d.action === 'added') {
                        badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        actionText = 'создано';
                      } else if (d.action === 'deleted') {
                        badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                        actionText = 'удалено';
                      }

                      let typeLabel: string = d.type;
                      if (d.type === 'artist') typeLabel = 'Артист';
                      if (d.type === 'album') typeLabel = 'Релиз';
                      if (d.type === 'track') typeLabel = 'Трек';
                      if (d.type === 'video') typeLabel = 'Клип';
                      if (d.type === 'news') typeLabel = 'Новость';
                      if (d.type === 'broadcast') typeLabel = 'Пуш';
                      if (d.type === 'setting') typeLabel = 'Настройки';
                      if (d.type === 'file') typeLabel = 'Файл';

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {actionText}
                            </span>
                            <span className="text-zinc-400 text-[11px]">{typeLabel}:</span>
                            <span className="text-zinc-200 font-medium truncate">{d.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-600 shrink-0 ml-2">{d.id}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active saving progress indicator with progress bar & file details */}
              {isSaving && (
                <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-200 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      {publishProgress.stepTitle || savingStatusText || 'Выполняется выгрузка...'}
                    </span>
                    <span className="font-mono tabular-nums text-purple-300 font-bold text-xs">
                      {publishProgress.percentage}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-zinc-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-700/50">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                      style={{ width: `${Math.max(publishProgress.percentage, 4)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                    <div className="truncate max-w-[70%]">
                      {publishProgress.currentFileName ? (
                        <span className="font-mono text-zinc-300 truncate">
                          Файл: <b className="text-zinc-100">{publishProgress.currentFileName}</b>
                        </span>
                      ) : (
                        <span>Идёт синхронизация с GitHub...</span>
                      )}
                    </div>
                    {publishProgress.totalSteps > 0 && (
                      <span className="text-zinc-500 font-mono shrink-0">
                        Шаг {publishProgress.currentStep} из {publishProgress.totalSteps}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(actionError || error) && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Статус операции</span>
                  </div>
                  <p className="text-rose-200 text-[11px] leading-relaxed">
                    {actionError || error}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!successResult && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
            {isSaving ? (
              <>
                <button
                  type="button"
                  onClick={cancelPublish}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Отменить загрузку</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span className="font-mono text-[11px]">Отправка в репозиторий...</span>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!token.trim() || diffs.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    {pendingFiles.length > 0
                      ? `Выгрузить всё в GitHub (${pendingFiles.length} ф. + каталог)`
                      : 'Опубликовать коммит'}
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
