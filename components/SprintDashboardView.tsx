import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Plus,
  Target,
  Trash2,
  X
} from 'lucide-react';
import { BOGOTA_TIMEZONE } from '../constants';
import { SprintBoard, SprintBoardId } from '../types';

interface SprintDashboardViewProps {
  boards: SprintBoard[];
  onChangeBoards: (boards: SprintBoard[]) => void;
}

const TOTAL_WEEKLY_USEFUL_MS = 23 * 60 * 60 * 1000;

const getBogotaNow = () =>
  new Date(
    new Date().toLocaleString('en-US', {
      timeZone: BOGOTA_TIMEZONE
    })
  );

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const parseHours = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed)) return 0;
  return clamp(parsed, 0, 999);
};

const readHours = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(value, 0) : 0;

const formatHours = (hours: number) =>
  `${readHours(hours).toLocaleString('es-CO', {
    maximumFractionDigits: 2
  })}h`;

const getStartOfBogotaWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return start;
};

const getEndOfBogotaWeek = (date: Date) => {
  const end = new Date(getStartOfBogotaWeek(date));
  end.setDate(end.getDate() + 7);
  return end;
};

const formatRangeLabel = (start: Date, end: Date) =>
  `${start.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short'
  })} - ${end.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short'
  })}`;

const formatRemainingTime = (ms: number) => {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getBiweeklyWindow = (date: Date) => {
  const start = new Date(date);
  const end = new Date(date);
  const day = start.getDate();

  if (day <= 15) {
    start.setDate(1);
    end.setDate(15);
  } else {
    start.setDate(16);
    end.setMonth(end.getMonth() + 1, 0);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const SprintDashboardView: React.FC<SprintDashboardViewProps> = ({
  boards,
  onChangeBoards
}) => {
  const [bogotaNow, setBogotaNow] = useState(getBogotaNow());
  const [activeBoardId, setActiveBoardId] = useState<SprintBoardId | null>(null);
  const [newItemDrafts, setNewItemDrafts] = useState<Record<string, string>>({});
  const [newItemHourDrafts, setNewItemHourDrafts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setBogotaNow(getBogotaNow());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const weekStart = useMemo(() => getStartOfBogotaWeek(bogotaNow), [bogotaNow]);
  const weekEnd = useMemo(() => getEndOfBogotaWeek(bogotaNow), [bogotaNow]);
  const biweeklyWindow = useMemo(() => getBiweeklyWindow(bogotaNow), [bogotaNow]);

  const remainingWeekFraction = clamp(
    (weekEnd.getTime() - bogotaNow.getTime()) /
      (weekEnd.getTime() - weekStart.getTime()),
    0,
    1
  );
  const remainingUsefulMs = Math.round(
    TOTAL_WEEKLY_USEFUL_MS * remainingWeekFraction
  );
  const consumedUsefulMs = TOTAL_WEEKLY_USEFUL_MS - remainingUsefulMs;

  const periodLabels = useMemo(() => {
    const monthlyStart = new Date(bogotaNow.getFullYear(), bogotaNow.getMonth(), 1);
    const monthlyEnd = new Date(
      bogotaNow.getFullYear(),
      bogotaNow.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    return {
      weekly: formatRangeLabel(weekStart, new Date(weekEnd.getTime() - 1)),
      biweekly: formatRangeLabel(
        biweeklyWindow.start,
        biweeklyWindow.end
      ),
      monthly: formatRangeLabel(monthlyStart, monthlyEnd)
    };
  }, [biweeklyWindow.end, biweeklyWindow.start, bogotaNow, weekEnd, weekStart]);

  const updateBoard = (
    boardId: SprintBoardId,
    updater: (board: SprintBoard) => SprintBoard
  ) => {
    onChangeBoards(
      boards.map(board => (board.id === boardId ? updater(board) : board))
    );
  };

  const getBoardMetrics = (board: SprintBoard) => {
    const totalCount = board.items.length;
    const completedCount = board.items.filter(item => item.done).length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const taskHours = board.items.reduce(
      (total, item) => total + readHours(item.estimatedHours),
      0
    );
    const completedTaskHours = board.items.reduce(
      (total, item) =>
        item.done ? total + readHours(item.estimatedHours) : total,
      0
    );

    return {
      completedCount,
      totalCount,
      progress,
      sprintHours: readHours(board.estimatedHours),
      taskHours,
      completedTaskHours
    };
  };

  const addItem = (boardId: SprintBoardId) => {
    const text = newItemDrafts[boardId]?.trim();
    if (!text) return;
    const estimatedHours = parseHours(newItemHourDrafts[boardId] || '0');

    updateBoard(boardId, board => ({
      ...board,
      items: [
        ...board.items,
        {
          id: `${boardId}-${Date.now()}`,
          text,
          done: false,
          estimatedHours
        }
      ]
    }));

    setNewItemDrafts(currentDrafts => ({
      ...currentDrafts,
      [boardId]: ''
    }));
    setNewItemHourDrafts(currentDrafts => ({
      ...currentDrafts,
      [boardId]: ''
    }));
  };

  const renderBoardProgress = (board: SprintBoard) => {
    const metrics = getBoardMetrics(board);

    return (
      <div className="mt-5 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-notion-muted">
              Avance de sub objetivos
            </div>
            <div className="mt-1 text-xs text-notion-muted">
              {metrics.completedCount}/{metrics.totalCount} logrados
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-white">
              {Math.round(metrics.progress)}%
            </div>
            <div className="text-[11px] text-notion-muted">
              {formatHours(metrics.completedTaskHours)} hechas
            </div>
          </div>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${metrics.progress}%`,
              backgroundColor: board.color
            }}
          />
        </div>

        <div className="grid gap-2 border-y border-white/5 py-3 text-xs sm:grid-cols-3">
          <div>
            <span className="block text-notion-muted">Plan sprint</span>
            <strong className="mt-1 block text-white">
              {formatHours(metrics.sprintHours)}
            </strong>
          </div>
          <div>
            <span className="block text-notion-muted">Tareas</span>
            <strong className="mt-1 block text-white">
              {formatHours(metrics.taskHours)}
            </strong>
          </div>
          <div>
            <span className="block text-notion-muted">Pendiente</span>
            <strong className="mt-1 block text-white">
              {formatHours(Math.max(metrics.taskHours - metrics.completedTaskHours, 0))}
            </strong>
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-notion-border bg-[#181818] px-3 py-2 text-xs text-notion-muted focus-within:border-white/30">
          <Clock size={14} />
          <span className="shrink-0">Horas del sprint</span>
          <input
            type="number"
            min="0"
            step="0.25"
            defaultValue={metrics.sprintHours || ''}
            onBlur={event =>
              updateBoard(board.id, current => ({
                ...current,
                estimatedHours: parseHours(event.target.value)
              }))
            }
            onKeyDown={event => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold text-white outline-none"
          />
        </label>
      </div>
    );
  };

  const renderBoardItems = (board: SprintBoard, compact: boolean) => (
    <div className="space-y-3">
      {board.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-notion-border/60 bg-[#181818] px-4 py-4 text-sm text-notion-muted">
          Sin sub objetivos aun. Agrega el primero desde aqui o desde el modal.
        </div>
      ) : (
        board.items.map(item => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-notion-border bg-[#181818] px-3 py-3"
          >
            <button
              type="button"
              onClick={() =>
                updateBoard(board.id, current => ({
                  ...current,
                  items: current.items.map(currentItem =>
                    currentItem.id === item.id
                      ? { ...currentItem, done: !currentItem.done }
                      : currentItem
                  )
                }))
              }
              className={`rounded-full p-1 ${
                item.done ? 'text-emerald-400' : 'text-notion-muted'
              }`}
            >
              <CheckCircle2 size={compact ? 16 : 18} />
            </button>

            <input
              value={item.text}
              onChange={event =>
                updateBoard(board.id, current => ({
                  ...current,
                  items: current.items.map(currentItem =>
                    currentItem.id === item.id
                      ? { ...currentItem, text: event.target.value }
                      : currentItem
                  )
                }))
              }
              className={`min-w-[130px] flex-1 bg-transparent outline-none ${
                compact ? 'text-sm' : 'text-base'
              } ${
                item.done ? 'text-notion-muted line-through' : 'text-white'
              }`}
            />

            <label className="flex h-9 w-[5.5rem] shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 text-[11px] text-notion-muted focus-within:border-white/30">
              <Clock size={13} />
              <input
                type="number"
                min="0"
                step="0.25"
                defaultValue={readHours(item.estimatedHours) || ''}
                onBlur={event =>
                  updateBoard(board.id, current => ({
                    ...current,
                    items: current.items.map(currentItem =>
                      currentItem.id === item.id
                        ? {
                            ...currentItem,
                            estimatedHours: parseHours(event.target.value)
                          }
                      : currentItem
                    )
                  }))
                }
                onKeyDown={event => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
                placeholder="0"
                aria-label="Horas estimadas del sub objetivo"
                className="min-w-0 flex-1 bg-transparent text-right font-semibold text-white outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                updateBoard(board.id, current => ({
                  ...current,
                  items: current.items.filter(
                    currentItem => currentItem.id !== item.id
                  )
                }))
              }
              className="rounded-full p-1 text-notion-muted transition-colors hover:bg-white/10 hover:text-red-400"
            >
              <Trash2 size={compact ? 14 : 16} />
            </button>
          </div>
        ))
      )}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_5.75rem_auto]">
        <input
          value={newItemDrafts[board.id] || ''}
          onChange={event =>
            setNewItemDrafts(currentDrafts => ({
              ...currentDrafts,
              [board.id]: event.target.value
            }))
          }
          onKeyDown={event => {
            if (event.key === 'Enter') addItem(board.id);
          }}
          placeholder="Agregar sub objetivo..."
          className="flex-1 rounded-xl border border-notion-border bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
        />
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-notion-border bg-[#181818] px-3 text-xs text-notion-muted focus-within:border-white/30">
          <Clock size={14} />
          <input
            type="number"
            min="0"
            step="0.25"
            value={newItemHourDrafts[board.id] || ''}
            onChange={event =>
              setNewItemHourDrafts(currentDrafts => ({
                ...currentDrafts,
                [board.id]: event.target.value
              }))
            }
            onKeyDown={event => {
              if (event.key === 'Enter') addItem(board.id);
            }}
            placeholder="Horas"
            aria-label="Horas estimadas para el nuevo sub objetivo"
            className="min-w-0 flex-1 bg-transparent text-white outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => addItem(board.id)}
          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-slate-200"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} />
            Agregar
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-auto px-6 py-8 lg:px-10 xl:px-14 2xl:px-20">
      <div className="space-y-8 pb-20">
        <div>
          <h1 className="text-4xl font-black text-notion-text">
            Sprint Dashboard
          </h1>
          <p className="mt-2 text-sm text-notion-muted">
            Panel productivo separado con timer semanal util y seguimiento de sprints sincronizado.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-500/30 bg-[#111827] p-6 shadow-[0_0_70px_rgba(37,99,235,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Target className="text-blue-400" size={22} />
                <h2 className="text-2xl font-black text-white">
                  Timer semanal util
                </h2>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Semana actual: {periodLabels.weekly} - reinicio cada lunes 00:00 en Bogota.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
              <span className="block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                Zona horaria
              </span>
              <span className="mt-1 block font-semibold text-white">
                America/Bogota
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-blue-200/80">
                Horas utiles restantes
              </div>
              <div className="mt-3 text-5xl font-black text-white">
                {formatRemainingTime(remainingUsefulMs)}
              </div>
              <div className="mt-2 text-sm text-slate-300">
                {`${(remainingUsefulMs / 3600000).toFixed(2)}h restantes de 23h semanales utiles.`}
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                  style={{ width: `${remainingWeekFraction * 100}%` }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                  Restante
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {(remainingUsefulMs / 3600000).toFixed(2)}h
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                  Consumido
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {(consumedUsefulMs / 3600000).toFixed(2)}h
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                  Ritmo lineal
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {(23 / 7).toFixed(2)}h/dia
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {boards.map(board => {
            const metrics = getBoardMetrics(board);
            const isActive = activeBoardId === board.id;

            return (
              <div
                key={board.id}
                className="rounded-3xl border bg-[#171717] p-5 transition-all"
                style={{
                  borderColor: `${board.color}${metrics.totalCount > 0 ? 'aa' : '44'}`,
                  boxShadow:
                    metrics.totalCount > 0
                      ? `0 24px 70px ${board.color}22`
                      : '0 10px 30px rgba(0,0,0,0.18)'
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: board.color }}
                      />
                      <h3 className="text-xl font-bold text-white">
                        {board.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-notion-muted">
                      {board.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-notion-muted">
                      <Calendar size={12} />
                      <span>{periodLabels[board.id]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: `${board.color}22`,
                        color: board.color
                      }}
                    >
                      {metrics.completedCount}/{metrics.totalCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateBoard(board.id, current => ({
                          ...current,
                          isCollapsed: !current.isCollapsed
                        }))
                      }
                      className="rounded-full p-2 text-notion-muted transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {board.isCollapsed ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronUp size={16} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBoardId(board.id)}
                      className={`rounded-full p-2 transition-colors ${
                        isActive
                          ? 'bg-white text-black'
                          : 'text-notion-muted hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                {renderBoardProgress(board)}

                {!board.isCollapsed && (
                  <div className="mt-5">{renderBoardItems(board, true)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeBoardId && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          onClick={() => setActiveBoardId(null)}
        >
          {boards
            .filter(board => board.id === activeBoardId)
            .map(board => (
              <div
                key={board.id}
                className="flex h-[84vh] w-[92vw] max-w-5xl flex-col overflow-hidden rounded-3xl border bg-[#171717]"
                style={{
                  borderColor: `${board.color}88`,
                  boxShadow: `0 0 90px ${board.color}22`
                }}
                onClick={event => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-notion-border bg-[#1e1e1e] px-6 py-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: board.color }}
                      />
                      <h2 className="text-2xl font-black text-white">
                        {board.title}
                      </h2>
                    </div>
                    <p className="mt-2 text-sm text-notion-muted">
                      {periodLabels[board.id]} - {board.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveBoardId(null)}
                    className="rounded-full p-2 text-notion-muted transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto bg-[#151515] px-6 py-6 custom-scrollbar">
                  <div className="mb-6">{renderBoardProgress(board)}</div>
                  {renderBoardItems(board, false)}
                </div>
              </div>
            ))}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30343b; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4a5160; }
      `}</style>
    </div>
  );
};
