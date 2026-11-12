import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, getTimeGreeting, AdminProfile } from '../../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Delete,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Dices,
  Flag,
  HelpCircle,
  Crosshair,
  AlertCircle,
} from 'lucide-react';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentProfile } = useAuth();

  // If already authenticated, render studio content
  if (isAuthenticated && currentProfile) {
    return <>{children}</>;
  }

  return <AuthGateModal />;
};

// ==========================================
// CAPTCHA 1: FLAG CHALLENGES
// ==========================================
interface FlagChallenge {
  id: string;
  targetCountry: string;
  targetFlag: string;
  taskTitle: string;
  taskDescription: string;
  options: Array<{
    country: string;
    flag: string;
    isCorrect: boolean;
  }>;
}

const FLAG_POOL: FlagChallenge[] = [
  {
    id: 'uganda',
    targetCountry: 'Уганда',
    targetFlag: '🇺🇬',
    taskTitle: 'Выберите флаг Уганды 🇺🇬',
    taskDescription: 'Докажите, что у вас есть настоящий музыкальный слух и чувство ритма',
    options: [
      { country: 'Уганда', flag: '🇺🇬', isCorrect: true },
      { country: 'Зимбабве', flag: '🇿🇼', isCorrect: false },
      { country: 'Кения', flag: '🇰🇪', isCorrect: false },
      { country: 'Албания', flag: '🇦🇱', isCorrect: false },
      { country: 'Мадагаскар', flag: '🇲🇬', isCorrect: false },
      { country: 'Бразилия', flag: '🇧🇷', isCorrect: false },
    ],
  },
  {
    id: 'zimbabwe',
    targetCountry: 'Зимбабве',
    targetFlag: '🇿🇼',
    taskTitle: 'Найдите флаг Зимбабве 🇿🇼',
    taskDescription: 'Здесь темп инфляции почти сравнялся со скоростью читки в 220 BPM',
    options: [
      { country: 'ЮАР', flag: '🇿🇦', isCorrect: false },
      { country: 'Зимбабве', flag: '🇿🇼', isCorrect: true },
      { country: 'Гана', flag: '🇬🇭', isCorrect: false },
      { country: 'Конго', flag: '🇨🇬', isCorrect: false },
      { country: 'Ямайка', flag: '🇯🇲', isCorrect: false },
      { country: 'Уганда', flag: '🇺🇬', isCorrect: false },
    ],
  },
  {
    id: 'dprk',
    targetCountry: 'КНДР',
    targetFlag: '🇰🇵',
    taskTitle: 'Укажите флаг КНДР (Северная Корея) 🇰🇵',
    taskDescription: 'Строгий партийный контроль качества для сведения самых плотных 808-х басов',
    options: [
      { country: 'Южная Корея', flag: '🇰🇷', isCorrect: false },
      { country: 'Вьетнам', flag: '🇻🇳', isCorrect: false },
      { country: 'КНДР', flag: '🇰🇵', isCorrect: true },
      { country: 'Китай', flag: '🇨🇳', isCorrect: false },
      { country: 'Япония', flag: '🇯🇵', isCorrect: false },
      { country: 'Монголия', flag: '🇲🇳', isCorrect: false },
    ],
  },
  {
    id: 'brazil',
    targetCountry: 'Бразилия',
    targetFlag: '🇧🇷',
    taskTitle: 'Выберите флаг Бразилии 🇧🇷',
    taskDescription: 'Родина бразильского фонка и самых агрессивных дрифт-треков в TikTok',
    options: [
      { country: 'Аргентина', flag: '🇦🇷', isCorrect: false },
      { country: 'Колумбия', flag: '🇨🇴', isCorrect: false },
      { country: 'Бразилия', flag: '🇧🇷', isCorrect: true },
      { country: 'Мексика', flag: '🇲🇽', isCorrect: false },
      { country: 'Перу', flag: '🇵🇪', isCorrect: false },
      { country: 'Португалия', flag: '🇵🇹', isCorrect: false },
    ],
  },
  {
    id: 'kazakhstan',
    targetCountry: 'Казахстан',
    targetFlag: '🇰🇿',
    taskTitle: 'Выберите флаг Казахстана 🇰🇿',
    taskDescription: 'Главная кузница платиновых хитов и легендарного кальянного рэпа',
    options: [
      { country: 'Узбекистан', flag: '🇺🇿', isCorrect: false },
      { country: 'Казахстан', flag: '🇰🇿', isCorrect: true },
      { country: 'Кыргызстан', flag: '🇰🇬', isCorrect: false },
      { country: 'Таджикистан', flag: '🇹🇯', isCorrect: false },
      { country: 'Туркменистан', flag: '🇹🇲', isCorrect: false },
      { country: 'Азербайджан', flag: '🇦🇿', isCorrect: false },
    ],
  },
];

// ==========================================
// CAPTCHA 2: EVLAMPIA PHOTO CHALLENGES
// ==========================================
interface EvlampiaChallenge {
  id: string;
  image: string;
  taskTitle: string;
  taskSubtitle: string;
  targetXPercent: number; // 0 - 100
  targetYPercent: number; // 0 - 100
  tolerancePercent: number; // radius
}

const EVLAMPIA_POOL: EvlampiaChallenge[] = [
  {
    id: 'close_nose',
    image: '/assets/evlampia/evlampia_close.jpg',
    taskTitle: 'Нажмите на носик Евлампии 👃',
    taskSubtitle: 'Опознайте носик Евлампии на фотографии для перехода к PIN-коду',
    targetXPercent: 49,
    targetYPercent: 43,
    tolerancePercent: 16,
  },
  {
    id: 'close_glasses',
    image: '/assets/evlampia/evlampia_close.jpg',
    taskTitle: 'Нажмите на очки Евлампии 👓',
    taskSubtitle: 'Кликните точно по оправе очков Евлампии',
    targetXPercent: 49,
    targetYPercent: 25,
    tolerancePercent: 18,
  },
  {
    id: 'phone_handset',
    image: '/assets/evlampia/evlampia_phone.jpg',
    taskTitle: 'Нажмите на телефонную трубку Евлампии ☎️',
    taskSubtitle: 'Кликните по стационарной телефонной трубке у уха Евлампии',
    targetXPercent: 20,
    targetYPercent: 58,
    tolerancePercent: 19,
  },
  {
    id: 'alf_friend',
    image: '/assets/evlampia/evlampia_alf.jpg',
    taskTitle: 'Нажмите на Альфа (друга Евлампии) 🧸',
    taskSubtitle: 'Найдите пушистого пришельца Альфа слева на столе',
    targetXPercent: 13,
    targetYPercent: 65,
    tolerancePercent: 18,
  },
  {
    id: 'cards_hand',
    image: '/assets/evlampia/evlampia_cards.jpg',
    taskTitle: 'Нажмите на игральные карты Евлампии 🃏',
    taskSubtitle: 'Кликните по колоде карт в руке Евлампии',
    targetXPercent: 9,
    targetYPercent: 82,
    tolerancePercent: 19,
  },
  {
    id: 'scream_sphere',
    image: '/assets/evlampia/evlampia_scream.jpg',
    taskTitle: 'Нажмите на магический шар Евлампии 🔮',
    taskSubtitle: 'Опознайте светящийся шар на столе рядом с Евлампией',
    targetXPercent: 12,
    targetYPercent: 48,
    tolerancePercent: 19,
  },
];

const AuthGateModal: React.FC = () => {
  const { verifyPin, commitLogin } = useAuth();

  // Stages: 'question' | 'flag_captcha' | 'evlampia_captcha' | 'pin' | 'welcome'
  const [stage, setStage] = useState<'question' | 'flag_captcha' | 'evlampia_captcha' | 'pin' | 'welcome'>('question');

  // Stage 1 (Question: "Вы гей?")
  const [questionDeniedCount, setQuestionDeniedCount] = useState<number>(0);
  const [questionShake, setQuestionShake] = useState(false);

  // Stage 2 (Flag Captcha)
  const [flagIndex, setFlagIndex] = useState<number>(0);
  const [flagShake, setFlagShake] = useState<boolean>(false);
  const [flagError, setFlagError] = useState<string | null>(null);
  const [flagSolved, setFlagSolved] = useState<boolean>(false);
  const [selectedWrongFlag, setSelectedWrongFlag] = useState<string | null>(null);

  // Stage 3 (Evlampia Captcha)
  const [evlampiaIndex, setEvlampiaIndex] = useState<number>(0);
  const [evlampiaShake, setEvlampiaShake] = useState<boolean>(false);
  const [evlampiaError, setEvlampiaError] = useState<string | null>(null);
  const [evlampiaSolved, setEvlampiaSolved] = useState<boolean>(false);
  const [lastClickMarker, setLastClickMarker] = useState<{ x: number; y: number; isSuccess: boolean } | null>(null);
  const evlampiaImageRef = useRef<HTMLImageElement | null>(null);

  // Stage 4 (PIN Keypad)
  const [pin, setPin] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinShake, setPinShake] = useState<boolean>(false);

  // Stage 5 (Welcome Screen)
  const [matchedProfile, setMatchedProfile] = useState<AdminProfile | null>(null);
  const [welcomeProgress, setWelcomeProgress] = useState<number>(0);

  const currentFlag = FLAG_POOL[flagIndex % FLAG_POOL.length];
  const currentEvlampia = EVLAMPIA_POOL[evlampiaIndex % EVLAMPIA_POOL.length];

  // ==========================================
  // STAGE 1 HANDLERS
  // ==========================================
  const handleQuestionNo = () => {
    setQuestionDeniedCount((prev) => prev + 1);
    setQuestionShake(true);
    setTimeout(() => setQuestionShake(false), 500);
  };

  const handleQuestionYes = () => {
    const randFlag = Math.floor(Math.random() * FLAG_POOL.length);
    setFlagIndex(randFlag);
    setStage('flag_captcha');
    setFlagError(null);
    setFlagSolved(false);
  };

  // ==========================================
  // STAGE 2 (FLAG CAPTCHA) HANDLERS
  // ==========================================
  const handleNextFlag = () => {
    setFlagIndex((prev) => (prev + 1) % FLAG_POOL.length);
    setFlagError(null);
    setSelectedWrongFlag(null);
  };

  const handleSelectFlag = (opt: { country: string; flag: string; isCorrect: boolean }) => {
    if (flagSolved) return;

    if (opt.isCorrect) {
      setFlagSolved(true);
      setFlagError(null);
      setSelectedWrongFlag(null);

      // Smooth transition to Stage 2 of Captcha: Evlampia!
      setTimeout(() => {
        const randEv = Math.floor(Math.random() * EVLAMPIA_POOL.length);
        setEvlampiaIndex(randEv);
        setStage('evlampia_captcha');
        setEvlampiaSolved(false);
        setEvlampiaError(null);
        setLastClickMarker(null);
      }, 700);
    } else {
      setSelectedWrongFlag(opt.country);
      setFlagError(`Мимо! Это флаг ${opt.country} (${opt.flag}). Попробуйте ещё раз 💀`);
      setFlagShake(true);
      setTimeout(() => setFlagShake(false), 500);
    }
  };

  // ==========================================
  // STAGE 3 (EVLAMPIA CAPTCHA) HANDLERS
  // ==========================================
  const handleNextEvlampia = () => {
    setEvlampiaIndex((prev) => (prev + 1) % EVLAMPIA_POOL.length);
    setEvlampiaError(null);
    setLastClickMarker(null);
  };

  const handleEvlampiaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (evlampiaSolved || !evlampiaImageRef.current) return;

    const rect = evlampiaImageRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const distance = Math.hypot(
      clickX - currentEvlampia.targetXPercent,
      clickY - currentEvlampia.targetYPercent
    );

    if (distance <= currentEvlampia.tolerancePercent) {
      // Success! Hit target
      setLastClickMarker({ x: clickX, y: clickY, isSuccess: true });
      setEvlampiaSolved(true);
      setEvlampiaError(null);

      setTimeout(() => {
        setStage('pin');
        setPin('');
        setPinError(null);
      }, 750);
    } else {
      // Missed!
      setLastClickMarker({ x: clickX, y: clickY, isSuccess: false });
      setEvlampiaError(`Мимо! Это не та часть, вы промахнулись 😂 Попробуйте еще раз!`);
      setEvlampiaShake(true);
      setTimeout(() => setEvlampiaShake(false), 500);
    }
  };

  // ==========================================
  // STAGE 4 (PIN) HANDLERS
  // ==========================================
  const handleDigit = useCallback(
    async (digit: string) => {
      if (pin.length >= 4 || isChecking) return;

      const newPin = pin + digit;
      setPin(newPin);
      setPinError(null);

      if (newPin.length === 4) {
        setIsChecking(true);
        setTimeout(async () => {
          const res = await verifyPin(newPin);
          if (res.success && res.profile) {
            setMatchedProfile(res.profile);
            setStage('welcome');
          } else {
            setPinError(res.error || 'Неверный PIN-код доступа');
            setPinShake(true);
            setTimeout(() => {
              setPin('');
              setPinShake(false);
              setIsChecking(false);
            }, 550);
          }
        }, 120);
      }
    },
    [pin, isChecking, verifyPin]
  );

  const handleBackspace = useCallback(() => {
    if (isChecking) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  }, [isChecking]);

  const handleClear = useCallback(() => {
    if (isChecking) return;
    setPin('');
    setPinError(null);
  }, [isChecking]);

  // Physical keyboard support for PIN input
  useEffect(() => {
    if (stage !== 'pin') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage, handleDigit, handleBackspace, handleClear]);

  // Auto-progress animation on Welcome screen before committing login
  useEffect(() => {
    if (stage !== 'welcome' || !matchedProfile) return;

    const interval = setInterval(() => {
      setWelcomeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          commitLogin(matchedProfile);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [stage, matchedProfile, commitLogin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950 select-none overflow-hidden font-sans">
      {/* Background ambient neon glow lights */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none -top-28 -left-28 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none -bottom-28 -right-28 animate-pulse" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Cyber grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Container */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        {/* ======================================================== */}
        {/* STAGE 1: SECURITY QUESTION ("Вы гей?")                    */}
        {/* ======================================================== */}
        {stage === 'question' && (
          <div
            className={`p-7 sm:p-9 rounded-3xl bg-zinc-900/85 border border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/5 transition-all duration-300 ${
              questionShake ? 'animate-[wiggle_0.35s_ease-in-out_infinite]' : ''
            }`}
          >
            {/* Top Brand Tag */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-purple-500/20">
                  D
                </div>
                <span className="text-xs font-bold tracking-tight text-zinc-200">DarkMusic Studio</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                Gate Security
              </span>
            </div>

            {/* Icon & Question */}
            <div className="text-center space-y-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-purple-500/20 to-purple-900/10 border border-purple-500/30 flex items-center justify-center text-purple-300 mx-auto shadow-inner shadow-purple-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Вы гей?</h2>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Пройдите первичную верификацию личности для входа в студию DarkMusic
                </p>
              </div>
            </div>

            {/* Denial Warning (if 'Нет' was clicked) */}
            {questionDeniedCount > 0 && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs text-center leading-relaxed animate-fade-in">
                {questionDeniedCount === 1 && 'Доступ закрыт. Для входа в студию ответьте положительно!'}
                {questionDeniedCount === 2 && 'Отказ в доступе. Натуралам вход в студию строго воспрещен 🚫'}
                {questionDeniedCount >= 3 && 'Система зафиксировала попытку гетеросексуального взлома. Нажмите «Да»! 🏳️‍🌈'}
                <span className="block font-mono text-[10px] text-rose-400/80 mt-1">
                  Заблокированных попыток: {questionDeniedCount}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleQuestionNo}
                className="py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 font-semibold text-xs transition-all active:scale-95 shadow-sm"
              >
                Нет
              </button>
              <button
                type="button"
                onClick={handleQuestionYes}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Да</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 2: CAPTCHA 1 (FLAG SELECTION)                      */}
        {/* ======================================================== */}
        {stage === 'flag_captcha' && (
          <div
            className={`p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/5 transition-all duration-300 ${
              flagShake ? 'animate-[wiggle_0.35s_ease-in-out_infinite]' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">Капча: Этап 1 из 2</h3>
                  <p className="text-[10px] text-zinc-500">География и флаги</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextFlag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-semibold transition-colors"
                title="Сгенерировать другой вопрос"
              >
                <Dices className="w-3.5 h-3.5 text-purple-400" />
                <span>Другой флаг</span>
              </button>
            </div>

            {/* Task Prompt Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-purple-500/30 mb-4 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono">
                <Flag className="w-3 h-3" />
                <span>Задание 1</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-100">
                {currentFlag.taskTitle}
              </h2>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {currentFlag.taskDescription}
              </p>
            </div>

            {/* Success Notification */}
            {flagSolved && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>Флаг выбран верно! Переход ко второму этапу капчи... 🎉</span>
              </div>
            )}

            {/* Error Notification */}
            {flagError && !flagSolved && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-fade-in">
                {flagError}
              </div>
            )}

            {/* 6 Flag Options Grid (2x3) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
              {currentFlag.options.map((opt, i) => {
                const isThisWrong = selectedWrongFlag === opt.country;
                const isThisCorrect = flagSolved && opt.isCorrect;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectFlag(opt)}
                    disabled={flagSolved}
                    className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1 active:scale-95 ${
                      isThisCorrect
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105'
                        : isThisWrong
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                        : 'bg-zinc-800/40 hover:bg-zinc-800/80 border-zinc-700/60 hover:border-purple-500/50 text-zinc-200'
                    }`}
                  >
                    <span className="text-3xl filter drop-shadow select-none">{opt.flag}</span>
                    <span className="text-xs font-bold truncate max-w-full px-1">{opt.country}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-center text-zinc-500">
              Выберите правильный флаг, чтобы перейти ко второму этапу проверки личности
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 3: CAPTCHA 2 (EVLAMPIA PHOTO CLICK TARGET)        */}
        {/* ======================================================== */}
        {stage === 'evlampia_captcha' && (
          <div
            className={`p-6 sm:p-7 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/5 transition-all duration-300 ${
              evlampiaShake ? 'animate-[wiggle_0.35s_ease-in-out_infinite]' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">Капча: Этап 2 из 2</h3>
                  <p className="text-[10px] text-zinc-500">Тест на точность Евлампии</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextEvlampia}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-semibold transition-colors"
                title="Сменить фотографию Евлампии"
              >
                <Dices className="w-3.5 h-3.5 text-purple-400" />
                <span>Другое фото</span>
              </button>
            </div>

            {/* Task Prompt Box */}
            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-purple-500/30 mb-3 text-center space-y-0.5">
              <h2 className="text-base sm:text-lg font-black text-zinc-100">
                {currentEvlampia.taskTitle}
              </h2>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {currentEvlampia.taskSubtitle}
              </p>
            </div>

            {/* Feedback Notifications */}
            {evlampiaSolved && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>В яблочко! Евлампия подтверждена 🎯 Разблокировка PIN-кода...</span>
              </div>
            )}

            {evlampiaError && !evlampiaSolved && (
              <div className="mb-3 p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-fade-in">
                {evlampiaError}
              </div>
            )}

            {/* Interactive Photo Frame */}
            <div
              onClick={handleEvlampiaClick}
              className={`relative rounded-2xl overflow-hidden border-2 cursor-crosshair group shadow-xl transition-all ${
                evlampiaSolved
                  ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                  : 'border-zinc-800 hover:border-purple-500/70'
              }`}
            >
              <img
                ref={evlampiaImageRef}
                src={currentEvlampia.image}
                alt="Евлампия"
                className="w-full h-64 sm:h-72 object-cover block select-none pointer-events-none"
              />

              {/* Cursor helper overlay hint */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-zinc-300 pointer-events-none flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-purple-400" />
                <span>Кликните по фото</span>
              </div>

              {/* Click Marker feedback */}
              {lastClickMarker && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping-once transition-all duration-200"
                  style={{
                    left: `${lastClickMarker.x}%`,
                    top: `${lastClickMarker.y}%`,
                  }}
                >
                  {lastClickMarker.isSuccess ? (
                    <div className="relative flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-emerald-400 bg-emerald-500/40 animate-ping absolute" />
                      <div className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-500/70 shadow-[0_0_20px_#10b981] flex items-center justify-center text-white">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-rose-500 bg-rose-500/60 shadow-[0_0_15px_#f43f5e] flex items-center justify-center text-white font-bold text-xs">
                      ✕
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[10px] text-center text-zinc-500 mt-2.5">
              Нажмите прямо на нужный объект на картинке, чтобы доказать, что вы не бот
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 4: PIN CODE KEYPAD (Secret, NO accounts listed)     */}
        {/* ======================================================== */}
        {stage === 'pin' && (
          <div
            className={`p-7 sm:p-8 rounded-3xl bg-zinc-900/85 border border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/5 transition-all duration-300 ${
              pinShake ? 'animate-[wiggle_0.35s_ease-in-out_infinite]' : ''
            }`}
          >
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-indigo-900/10 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mx-auto shadow-inner">
                <KeyRound className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Вход по PIN-коду</h2>
              <p className="text-xs text-zinc-400">Введите 4-значный персональный PIN-код</p>
            </div>

            {/* PIN Bubbles / Dots */}
            <div className="flex items-center justify-center gap-3.5 mb-6">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                const isCurrent = pin.length === idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 shadow-[0_0_14px_rgba(168,85,247,0.8)] scale-110'
                        : isCurrent
                        ? 'border-2 border-purple-500/80 bg-zinc-800 ring-2 ring-purple-500/20'
                        : 'border border-zinc-700 bg-zinc-950/80'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {pinError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] text-center font-medium animate-fade-in">
                {pinError}
              </div>
            )}

            {/* Interactive Tactile Numpad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[270px] mx-auto mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  disabled={isChecking}
                  className="h-13 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 active:bg-purple-600/30 border border-zinc-700/50 hover:border-purple-500/40 text-lg font-bold text-zinc-100 transition-all active:scale-95 shadow-sm"
                >
                  {digit}
                </button>
              ))}

              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                disabled={isChecking || pin.length === 0}
                className="h-13 rounded-2xl bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800/80 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-1"
                title="Сбросить ввод"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Zero */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                disabled={isChecking}
                className="h-13 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 active:bg-purple-600/30 border border-zinc-700/50 hover:border-purple-500/40 text-lg font-bold text-zinc-100 transition-all active:scale-95 shadow-sm"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isChecking || pin.length === 0}
                className="h-13 rounded-2xl bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                title="Стереть"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 5: WELCOME SCREEN (Dynamic Time Greeting)           */}
        {/* ======================================================== */}
        {stage === 'welcome' && matchedProfile && (
          <div className="p-8 sm:p-10 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-[0_0_80px_rgba(168,85,247,0.25)] backdrop-blur-2xl ring-1 ring-purple-500/30 text-center space-y-6 animate-fade-in">
            {/* Glowing Avatar */}
            <div className="relative inline-block mx-auto">
              <div
                className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${matchedProfile.color} flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-purple-500/30`}
              >
                {matchedProfile.name[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-white text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Dynamic Time of Day Greeting */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300">
                <Sparkles className="w-3 h-3 text-purple-400" />
                {matchedProfile.badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                {getTimeGreeting(matchedProfile.name)}
              </h2>
              <p className="text-xs text-zinc-400">
                Авторизация успешна. Выполняется вход в панель управления...
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 max-w-xs mx-auto">
              <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-zinc-700/50">
                <div
                  className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-100"
                  style={{ width: `${welcomeProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>Инициализация студии</span>
                <span>{welcomeProgress}%</span>
              </div>
            </div>

            {/* Fast-forward Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => commitLogin(matchedProfile)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                <span>Перейти в студию</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};
