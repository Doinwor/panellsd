import React, { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { Bell, AlertTriangle, Pin, RefreshCw, Sparkles, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export const BroadcastsView: React.FC = () => {
  const { catalog, updateBroadcast, updateForceUpdate, updateWhatsNew, sendInstantPushNotification, isSaving, token } = useCatalog();

  const [pushTitle, setPushTitle] = useState('🎵 Dark Music — Новый релиз!');
  const [pushMessage, setPushMessage] = useState('Слушайте новый трек резидентов лейбла в высоком качестве!');
  const [pushImage, setPushImage] = useState('logo.png');
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  if (!catalog) return null;

  const { systemPushBroadcast, tempBroadcast, pinnedBroadcast, forceUpdate, whatsNew } = catalog;

  // Single-shot instant push sender
  const handleSendInstantPush = async () => {
    if (!pushMessage.trim()) {
      setPushError('Введите текст push-сообщения.');
      return;
    }
    setPushError(null);
    setPushSuccess(null);

    try {
      const res = await sendInstantPushNotification(pushTitle, pushMessage, pushImage);
      setPushSuccess(`Push успешно отправлен в GitHub! Коммит: ${res.commitSha.slice(0, 7)}`);
      setTimeout(() => setPushSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки push-уведомления.';
      setPushError(msg);
    }
  };

  // Test notification locally in browser
  const handleTestDeviceNotification = async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает Notifications API.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(pushTitle || '🎵 Dark Music', {
        body: pushMessage || 'Тестовое уведомление',
        icon: '/logo.png',
      });
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(pushTitle || '🎵 Dark Music', {
          body: pushMessage || 'Тестовое уведомление',
          icon: '/logo.png',
        });
      }
    } else {
      alert('Уведомления заблокированы в настройках браузера. Разрешите их для этого сайта.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>Оповещения и Push-рассылки</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Мгновенная отправка системных push-уведомлений в шторку телефонов и ПК слушателей, баннеров и версий
        </p>
      </div>

      {/* 1. SINGLE-SHOT INSTANT PUSH SENDER (Featured Hero Card) */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-500/40 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Единоразовая Push-рассылка в шторку</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  Мгновенно
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Каждый слушатель получит уведомление на свой телефон или ПК при синхронизации приложения
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestDeviceNotification}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              🔔 Тест на моём устройстве
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Заголовок Push-уведомления
            </label>
            <input
              type="text"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder="🎵 Dark Music — Новый релиз!"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Иконка / Обложка (logo.png или covers/...)
            </label>
            <input
              type="text"
              value={pushImage}
              onChange={(e) => setPushImage(e.target.value)}
              placeholder="logo.png"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Текст сообщения (придёт в шторку телефонов и ПК) *
          </label>
          <textarea
            rows={2}
            value={pushMessage}
            onChange={(e) => setPushMessage(e.target.value)}
            placeholder="Опишите релиз или новость..."
            className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Current push status in catalog */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>Текущий ID в каталоге:</span>
            <span className="font-mono text-zinc-300 text-[11px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {systemPushBroadcast.id || 'нет активного пуша'}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                systemPushBroadcast.active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {systemPushBroadcast.active ? 'Активен' : 'Отключен'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {systemPushBroadcast.active && (
              <button
                type="button"
                onClick={() =>
                  updateBroadcast('systemPushBroadcast', { active: false })
                }
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
              >
                Отключить текущий пуш
              </button>
            )}

            <button
              type="button"
              disabled={isSaving || !token.trim() || !pushMessage.trim()}
              onClick={handleSendInstantPush}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className={`w-3.5 h-3.5 ${isSaving ? 'animate-bounce' : ''}`} />
              <span>{isSaving ? 'Рассылка в GitHub...' : 'Разослать Push сейчас (в 1 клик)'}</span>
            </button>
          </div>
        </div>

        {pushSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pushSuccess}</span>
          </div>
        )}

        {pushError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{pushError}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Pinned Broadcast Banner */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Pin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Закреплённое объявление (Pinned)</h3>
                <p className="text-[11px] text-zinc-500">Постоянная плашка в верхней части экрана приложения</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinnedBroadcast.active}
                onChange={(e) => updateBroadcast('pinnedBroadcast', { active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Заголовок плашки</label>
              <input
                type="text"
                value={pinnedBroadcast.title}
                onChange={(e) => updateBroadcast('pinnedBroadcast', { title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Текст сообщения</label>
              <textarea
                rows={3}
                value={pinnedBroadcast.message}
                onChange={(e) => updateBroadcast('pinnedBroadcast', { message: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Temp Broadcast Banner */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Временный баннер (Temp Broadcast)</h3>
                <p className="text-[11px] text-zinc-500">Появляется при входе и исчезает через 20 секунд</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={tempBroadcast.active}
                onChange={(e) => updateBroadcast('tempBroadcast', { active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Заголовок</label>
              <input
                type="text"
                value={tempBroadcast.title}
                onChange={(e) => updateBroadcast('tempBroadcast', { title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Текст</label>
              <textarea
                rows={3}
                value={tempBroadcast.message}
                onChange={(e) => updateBroadcast('tempBroadcast', { message: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 4. Force Update Controller */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Принудительное обновление (Force Update)</h3>
                <p className="text-[11px] text-zinc-500">Блокировка устаревших версий приложения</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={forceUpdate.active}
                onChange={(e) => updateForceUpdate({ active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Минимальная версия (requiredVersion)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={forceUpdate.requiredVersion}
                  onChange={(e) => updateForceUpdate({ requiredVersion: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Ссылка на скачивание
                </label>
                <input
                  type="text"
                  value={forceUpdate.downloadUrl}
                  onChange={(e) => updateForceUpdate({ downloadUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Сообщение для пользователя</label>
              <textarea
                rows={3}
                value={forceUpdate.message}
                onChange={(e) => updateForceUpdate({ message: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 5. What's New Dialog Content */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Что нового? (What's New)</h3>
                <p className="text-[11px] text-zinc-500">Ченджлог релиза при первом запуске после апдейта</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsNew.active}
                onChange={(e) => updateWhatsNew({ active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Заголовок</label>
                <input
                  type="text"
                  value={whatsNew.title}
                  onChange={(e) => updateWhatsNew({ title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Версия</label>
                <input
                  type="number"
                  step="0.1"
                  value={whatsNew.version}
                  onChange={(e) => updateWhatsNew({ version: parseFloat(e.target.value) || 4 })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Список изменений</label>
              <textarea
                rows={3}
                value={whatsNew.content}
                onChange={(e) => updateWhatsNew({ content: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono text-[11px] resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
