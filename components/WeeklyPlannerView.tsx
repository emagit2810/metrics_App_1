import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Target,
  Trash2,
  X
} from 'lucide-react';
import {
  PROJECT_COLORS,
  WEEKLY_DAY_FULL_LABELS,
  WEEKLY_DAY_LABELS,
  WEEKLY_DURATION_OPTIONS
} from '../constants';
import { WeeklyAchievement, WeeklyTimeBlock } from '../types';

interface WeeklyPlannerViewProps {
  blocks: WeeklyTimeBlock[];
  achievements: WeeklyAchievement[];
  onChangeBlocks: (blocks: WeeklyTimeBlock[]) => void;
  onChangeAchievements: (achievements: WeeklyAchievement[]) => void;
}

type FeedbackState = {
  type: 'error' | 'success';
  text: string;
} | null;

type DragState = {
  blockId: string;
  mode: 'move' | 'resize';
  originX: number;
  originY: number;
  initialDayIndex: number;
  initialStartMinutes: number;
  initialDurationMinutes: number;
};

const DAY_START_MINUTES = 6 * 60;
const DAY_END_MINUTES = 21 * 60;
const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 18;
const TOTAL_SLOTS = (DAY_END_MINUTES - DAY_START_MINUTES) / SLOT_MINUTES;
const MIN_BLOCK_DURATION = SLOT_MINUTES;
const TIMELINE_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;
const BLOCK_COLORS = PROJECT_COLORS.slice(0, 12);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const snapToSlot = (value: number) =>
  Math.round(value / SLOT_MINUTES) * SLOT_MINUTES;

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}`;
};

const minutesToInputValue = (minutes: number) => formatTime(minutes);

const inputValueToMinutes = (value: string) => {
  const [hours, mins] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return DAY_START_MINUTES;
  return hours * 60 + mins;
};

const hasCollision = (
  blocks: WeeklyTimeBlock[],
  blockId: string | null,
  dayIndex: number,
  startMinutes: number,
  durationMinutes: number
) => {
  const endMinutes = startMinutes + durationMinutes;
  return blocks.some(block => {
    if (block.id === blockId || block.dayIndex !== dayIndex) return false;
    const blockEnd = block.startMinutes + block.durationMinutes;
    return startMinutes < blockEnd && endMinutes > block.startMinutes;
  });
};

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  blocks,
  achievements,
  onChangeBlocks,
  onChangeAchievements
}) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedStartMinutes, setSelectedStartMinutes] =
    useState(DAY_START_MINUTES + 3 * 60);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDurationMinutes, setDraftDurationMinutes] = useState(60);
  const [draftColor, setDraftColor] = useState(BLOCK_COLORS[0]);
  const [draftNotes, setDraftNotes] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [achievementTitleDraft, setAchievementTitleDraft] = useState('');
  const [achievementColorDraft, setAchievementColorDraft] = useState(
    BLOCK_COLORS[4]
  );
  const [achievementItemDrafts, setAchievementItemDrafts] = useState<
    Record<string, string>
  >({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<WeeklyTimeBlock | null>(null);
  const [dragPreviewInvalid, setDragPreviewInvalid] = useState(false);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (!dragState) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      if (!gridRef.current) return;

      const activeBlock = blocks.find(block => block.id === dragState.blockId);
      if (!activeBlock) return;

      const rect = gridRef.current.getBoundingClientRect();
      const columnWidth = rect.width / WEEKLY_DAY_LABELS.length;
      const deltaSlots = Math.round(
        (event.clientY - dragState.originY) / SLOT_HEIGHT
      );

      let nextDayIndex = dragState.initialDayIndex;
      let nextStartMinutes = dragState.initialStartMinutes;
      let nextDurationMinutes = dragState.initialDurationMinutes;

      if (dragState.mode === 'move') {
        nextDayIndex = clamp(
          Math.floor((event.clientX - rect.left) / columnWidth),
          0,
          WEEKLY_DAY_LABELS.length - 1
        );
        nextStartMinutes = clamp(
          snapToSlot(
            dragState.initialStartMinutes + deltaSlots * SLOT_MINUTES
          ),
          DAY_START_MINUTES,
          DAY_END_MINUTES - dragState.initialDurationMinutes
        );
      } else {
        nextDurationMinutes = clamp(
          snapToSlot(
            dragState.initialDurationMinutes + deltaSlots * SLOT_MINUTES
          ),
          MIN_BLOCK_DURATION,
          DAY_END_MINUTES - dragState.initialStartMinutes
        );
      }

      const nextPreview = {
        ...activeBlock,
        dayIndex: nextDayIndex,
        startMinutes: nextStartMinutes,
        durationMinutes: nextDurationMinutes
      };

      setDragPreview(nextPreview);
      setDragPreviewInvalid(
        hasCollision(
          blocks,
          activeBlock.id,
          nextPreview.dayIndex,
          nextPreview.startMinutes,
          nextPreview.durationMinutes
        )
      );
    };

    const handlePointerUp = () => {
      if (dragPreview && !dragPreviewInvalid) {
        onChangeBlocks(
          blocks.map(block =>
            block.id === dragPreview.id ? dragPreview : block
          )
        );
      } else if (dragPreviewInvalid) {
        setFeedback({
          type: 'error',
          text: 'No se puede solapar una franja con otra. El bloque vuelve a su posicion anterior.'
        });
      }

      setDragState(null);
      setDragPreview(null);
      setDragPreviewInvalid(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [blocks, dragPreview, dragPreviewInvalid, dragState, onChangeBlocks]);

  const summary = useMemo(() => {
    const totalAchievementItems = achievements.reduce(
      (count, achievement) => count + achievement.items.length,
      0
    );
    const pendingAchievementItems = achievements.reduce(
      (count, achievement) =>
        count + achievement.items.filter(item => !item.done).length,
      0
    );

    return {
      blocks: blocks.length,
      achievements: achievements.length,
      totalAchievementItems,
      pendingAchievementItems
    };
  }, [achievements, blocks]);

  const resetDraft = () => {
    setDraftTitle('');
    setDraftDurationMinutes(60);
    setDraftColor(BLOCK_COLORS[0]);
    setDraftNotes('');
    setEditingBlockId(null);
  };

  const handleSelectSlot = (dayIndex: number, startMinutes: number) => {
    setSelectedDayIndex(dayIndex);
    setSelectedStartMinutes(startMinutes);
  };

  const startEditingBlock = (block: WeeklyTimeBlock) => {
    setEditingBlockId(block.id);
    setSelectedDayIndex(block.dayIndex);
    setSelectedStartMinutes(block.startMinutes);
    setDraftTitle(block.title);
    setDraftDurationMinutes(block.durationMinutes);
    setDraftColor(block.color);
    setDraftNotes(block.notes || '');
  };

  const handleSubmitBlock = () => {
    if (!draftTitle.trim()) {
      setFeedback({
        type: 'error',
        text: 'Escribe un titulo para crear o actualizar la franja.'
      });
      return;
    }

    if (
      hasCollision(
        blocks,
        editingBlockId,
        selectedDayIndex,
        selectedStartMinutes,
        draftDurationMinutes
      )
    ) {
      setFeedback({
        type: 'error',
        text: 'Ese horario ya esta ocupado. Elige otra hora o mueve el bloque existente.'
      });
      return;
    }

    const nextBlock: WeeklyTimeBlock = {
      id: editingBlockId || Date.now().toString(),
      title: draftTitle.trim(),
      dayIndex: selectedDayIndex,
      startMinutes: selectedStartMinutes,
      durationMinutes: draftDurationMinutes,
      color: draftColor,
      notes: draftNotes.trim()
    };

    if (editingBlockId) {
      onChangeBlocks(
        blocks.map(block => (block.id === editingBlockId ? nextBlock : block))
      );
      setFeedback({
        type: 'success',
        text: 'Franja actualizada y guardada en la memoria del navegador.'
      });
    } else {
      onChangeBlocks([...blocks, nextBlock]);
      setFeedback({
        type: 'success',
        text: 'Franja creada y guardada en la memoria del navegador.'
      });
    }

    resetDraft();
  };

  const handleDeleteBlock = (blockId: string) => {
    onChangeBlocks(blocks.filter(block => block.id !== blockId));
    if (editingBlockId === blockId) {
      resetDraft();
    }
  };

  const updateAchievement = (
    achievementId: string,
    updater: (achievement: WeeklyAchievement) => WeeklyAchievement
  ) => {
    onChangeAchievements(
      achievements.map(achievement =>
        achievement.id === achievementId ? updater(achievement) : achievement
      )
    );
  };

  const handleAddAchievement = () => {
    if (!achievementTitleDraft.trim()) {
      setFeedback({
        type: 'error',
        text: 'Agrega un titulo antes de crear un logro semanal.'
      });
      return;
    }

    onChangeAchievements([
      ...achievements,
      {
        id: Date.now().toString(),
        title: achievementTitleDraft.trim(),
        color: achievementColorDraft,
        items: []
      }
    ]);
    setAchievementTitleDraft('');
  };

  const handleDeleteAchievement = (achievementId: string) => {
    onChangeAchievements(
      achievements.filter(achievement => achievement.id !== achievementId)
    );
  };

  const handleAddAchievementItem = (achievementId: string) => {
    const text = achievementItemDrafts[achievementId]?.trim();
    if (!text) return;

    updateAchievement(achievementId, achievement => ({
      ...achievement,
      items: [
        ...achievement.items,
        {
          id: `${achievementId}-${Date.now()}`,
          text,
          done: false
        }
      ]
    }));

    setAchievementItemDrafts(currentDrafts => ({
      ...currentDrafts,
      [achievementId]: ''
    }));
  };

  const activeBlocks = useMemo(() => {
    if (!dragPreview) return blocks;
    return blocks.map(block => (block.id === dragPreview.id ? dragPreview : block));
  }, [blocks, dragPreview]);

  const renderPlannerGrid = () => (
    <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-notion-border bg-[#0f1115] shadow-2xl">
      <div className="h-full overflow-auto custom-scrollbar">
        <div className="min-w-[980px]">
          <div className="sticky top-0 z-20 grid grid-cols-[88px_repeat(6,minmax(0,1fr))] border-b border-notion-border bg-[#15171b]">
            <div className="border-r border-notion-border px-4 py-4 text-[11px] uppercase tracking-[0.24em] text-notion-muted">
              Hora
            </div>
            {WEEKLY_DAY_LABELS.map((label, index) => {
              const count = activeBlocks.filter(
                block => block.dayIndex === index
              ).length;

              return (
                <div
                  key={label}
                  className="border-r border-notion-border px-4 py-4 text-center last:border-r-0"
                >
                  <div className="text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                    {label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-notion-text">
                    {WEEKLY_DAY_FULL_LABELS[index]}
                  </div>
                  <div className="mt-1 text-[11px] text-notion-muted">
                    {count} bloques
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[88px_minmax(0,1fr)]">
            <div className="border-r border-notion-border bg-[#111317]">
              {Array.from({
                length: (DAY_END_MINUTES - DAY_START_MINUTES) / 60
              }).map((_, hourIndex) => (
                <div
                  key={hourIndex}
                  className="border-b border-notion-border/30 px-3 py-2 text-xs text-notion-muted"
                  style={{ height: SLOT_HEIGHT * 4 }}
                >
                  {formatTime(DAY_START_MINUTES + hourIndex * 60)}
                </div>
              ))}
            </div>

            <div
              ref={gridRef}
              className="relative grid grid-cols-6"
              style={{ height: TIMELINE_HEIGHT }}
            >
              {WEEKLY_DAY_LABELS.map((label, dayIndex) => (
                <div
                  key={label}
                  className="relative border-r border-notion-border/20 last:border-r-0"
                >
                  {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => {
                    const startMinutes =
                      DAY_START_MINUTES + slotIndex * SLOT_MINUTES;
                    const isSelected =
                      selectedDayIndex === dayIndex &&
                      selectedStartMinutes === startMinutes;

                    return (
                      <button
                        key={`${label}-${slotIndex}`}
                        type="button"
                        onClick={() => handleSelectSlot(dayIndex, startMinutes)}
                        className={`block w-full border-b text-left transition-colors ${
                          slotIndex % 4 === 0
                            ? 'border-notion-border/30'
                            : 'border-notion-border/10'
                        } ${
                          isSelected
                            ? 'bg-blue-500/10'
                            : 'bg-transparent hover:bg-white/[0.03]'
                        }`}
                        style={{ height: SLOT_HEIGHT }}
                        aria-label={`Seleccionar ${WEEKLY_DAY_FULL_LABELS[dayIndex]} ${formatTime(
                          startMinutes
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}

              <div className="pointer-events-none absolute inset-0">
                {activeBlocks.map(block => {
                  const isActiveDrag =
                    dragPreview?.id === block.id && dragPreviewInvalid;
                  const top =
                    ((block.startMinutes - DAY_START_MINUTES) / SLOT_MINUTES) *
                    SLOT_HEIGHT;
                  const height =
                    (block.durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT;
                  const widthPercent = 100 / WEEKLY_DAY_LABELS.length;

                  return (
                    <div
                      key={block.id}
                      className={`pointer-events-auto absolute rounded-xl border px-3 py-2 shadow-xl transition-all ${
                        isActiveDrag
                          ? 'border-red-500 bg-red-500/20'
                          : 'bg-[#111827]/90'
                      } ${
                        editingBlockId === block.id ? 'ring-2 ring-white/70' : ''
                      }`}
                      style={{
                        left: `calc(${block.dayIndex * widthPercent}% + 6px)`,
                        width: `calc(${widthPercent}% - 12px)`,
                        top,
                        height,
                        borderColor: isActiveDrag ? '#ef4444' : block.color,
                        boxShadow: `0 18px 35px ${block.color}22`
                      }}
                      onClick={event => {
                        event.stopPropagation();
                        startEditingBlock(block);
                      }}
                      onPointerDown={event => {
                        if (
                          (event.target as HTMLElement).dataset.handle === 'resize'
                        ) {
                          return;
                        }

                        event.preventDefault();
                        event.stopPropagation();
                        setDragState({
                          blockId: block.id,
                          mode: 'move',
                          originX: event.clientX,
                          originY: event.clientY,
                          initialDayIndex: block.dayIndex,
                          initialStartMinutes: block.startMinutes,
                          initialDurationMinutes: block.durationMinutes
                        });
                        setDragPreview(block);
                        setDragPreviewInvalid(false);
                      }}
                    >
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        className="absolute right-2 top-2 rounded-full p-1 text-notion-muted transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="pr-7">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: block.color }}
                          />
                          <p className="line-clamp-1 text-sm font-semibold text-white">
                            {block.title}
                          </p>
                        </div>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-notion-muted">
                          {WEEKLY_DAY_LABELS[block.dayIndex]} - {formatTime(block.startMinutes)} /{' '}
                          {formatTime(block.startMinutes + block.durationMinutes)}
                        </p>
                        {block.notes ? (
                          <p className="mt-2 line-clamp-3 text-xs text-slate-300">
                            {block.notes}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-notion-muted">
                            Arrastra para mover. Tira del borde inferior para redimensionar.
                          </p>
                        )}
                      </div>

                      <div
                        data-handle="resize"
                        className="absolute inset-x-0 bottom-0 h-3 cursor-ns-resize rounded-b-xl"
                        onPointerDown={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDragState({
                            blockId: block.id,
                            mode: 'resize',
                            originX: event.clientX,
                            originY: event.clientY,
                            initialDayIndex: block.dayIndex,
                            initialStartMinutes: block.startMinutes,
                            initialDurationMinutes: block.durationMinutes
                          });
                          setDragPreview(block);
                          setDragPreviewInvalid(false);
                        }}
                      >
                        <div className="mx-auto mt-1 h-1 w-12 rounded-full bg-white/30" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAchievementsModal = () => {
    if (!isAchievementsOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
        onClick={() => setIsAchievementsOpen(false)}
      >
        <div
          className="flex h-[84vh] w-[92vw] max-w-6xl flex-col overflow-hidden rounded-3xl border border-emerald-500/40 bg-[#171717] shadow-[0_0_80px_rgba(16,185,129,0.12)]"
          onClick={event => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-notion-border bg-[#1f1f1f] px-6 py-5">
            <div>
              <div className="flex items-center gap-3">
                <Target className="text-emerald-400" size={22} />
                <h2 className="text-2xl font-black text-white">
                  Logros semanales
                </h2>
              </div>
              <p className="mt-2 text-sm text-notion-muted">
                Metas de la semana con checklist, color y persistencia local.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAchievementsOpen(false)}
              className="rounded-full p-2 text-notion-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={22} />
            </button>
          </div>
          <div className="border-b border-notion-border bg-[#191919] px-6 py-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[240px] flex-1">
                <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                  Nuevo logro
                </label>
                <input
                  value={achievementTitleDraft}
                  onChange={event => setAchievementTitleDraft(event.target.value)}
                  placeholder="Ej: cerrar demo, terminar auth, revisar backlog..."
                  className="w-full rounded-xl border border-notion-border bg-[#202020] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {BLOCK_COLORS.slice(0, 8).map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAchievementColorDraft(color)}
                    className={`h-8 w-8 rounded-full border-2 ${
                      achievementColorDraft === color
                        ? 'border-white'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddAchievement}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
              >
                <span className="flex items-center gap-2">
                  <Plus size={16} />
                  Crear logro
                </span>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-[#151515] px-6 py-6 custom-scrollbar">
            {achievements.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-notion-border/60 bg-[#1d1d1d] text-center">
                <AlertTriangle className="text-notion-muted" size={34} />
                <p className="mt-4 text-lg font-semibold text-notion-text">
                  Todavia no hay logros semanales.
                </p>
                <p className="mt-2 max-w-md text-sm text-notion-muted">
                  Crea metas con subtareas y llevalas a completado sin salir de la app.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {achievements.map(achievement => {
                  const completedItems = achievement.items.filter(
                    item => item.done
                  ).length;

                  return (
                    <div
                      key={achievement.id}
                      className="rounded-2xl border bg-[#202020] p-5 shadow-xl"
                      style={{
                        borderColor: `${achievement.color}66`,
                        boxShadow: `0 20px 50px ${achievement.color}18`
                      }}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div
                          className="mt-1 h-3 w-3 rounded-full"
                          style={{ backgroundColor: achievement.color }}
                        />
                        <div className="min-w-[180px] flex-1">
                          <input
                            value={achievement.title}
                            onChange={event =>
                              updateAchievement(achievement.id, current => ({
                                ...current,
                                title: event.target.value
                              }))
                            }
                            className="w-full bg-transparent text-lg font-bold text-white outline-none"
                          />
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-notion-muted">
                            {completedItems}/{achievement.items.length} completadas
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAchievement(achievement.id)}
                          className="rounded-full p-2 text-notion-muted transition-colors hover:bg-white/10 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {BLOCK_COLORS.slice(0, 8).map(color => (
                          <button
                            key={`${achievement.id}-${color}`}
                            type="button"
                            onClick={() =>
                              updateAchievement(achievement.id, current => ({
                                ...current,
                                color
                              }))
                            }
                            className={`h-6 w-6 rounded-full border ${
                              achievement.color === color
                                ? 'border-white'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      <div className="mt-5 space-y-3">
                        {achievement.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-xl border border-notion-border bg-[#181818] px-3 py-3"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateAchievement(achievement.id, current => ({
                                  ...current,
                                  items: current.items.map(currentItem =>
                                    currentItem.id === item.id
                                      ? {
                                          ...currentItem,
                                          done: !currentItem.done
                                        }
                                      : currentItem
                                  )
                                }))
                              }
                              className={`rounded-full p-1 ${
                                item.done
                                  ? 'text-emerald-400'
                                  : 'text-notion-muted'
                              }`}
                            >
                              <CheckCircle2 size={18} />
                            </button>

                            <input
                              value={item.text}
                              onChange={event =>
                                updateAchievement(achievement.id, current => ({
                                  ...current,
                                  items: current.items.map(currentItem =>
                                    currentItem.id === item.id
                                      ? {
                                          ...currentItem,
                                          text: event.target.value
                                        }
                                      : currentItem
                                  )
                                }))
                              }
                              className={`flex-1 bg-transparent text-sm outline-none ${
                                item.done
                                  ? 'text-notion-muted line-through'
                                  : 'text-white'
                              }`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateAchievement(achievement.id, current => ({
                                  ...current,
                                  items: current.items.filter(
                                    currentItem => currentItem.id !== item.id
                                  )
                                }))
                              }
                              className="rounded-full p-1 text-notion-muted transition-colors hover:bg-white/10 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <input
                          value={achievementItemDrafts[achievement.id] || ''}
                          onChange={event =>
                            setAchievementItemDrafts(currentDrafts => ({
                              ...currentDrafts,
                              [achievement.id]: event.target.value
                            }))
                          }
                          onKeyDown={event => {
                            if (event.key === 'Enter') {
                              handleAddAchievementItem(achievement.id);
                            }
                          }}
                          placeholder="Agregar sub objetivo o checklist..."
                          className="flex-1 rounded-xl border border-notion-border bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddAchievementItem(achievement.id)}
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
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden px-6 py-8 lg:px-10 xl:px-14 2xl:px-20">
      <div className="flex h-full flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-notion-text">Semanal</h1>
            <p className="mt-2 text-sm text-notion-muted">
              Plantilla editable Lun-Sab con bloques visuales, drag and drop y guardado local en IndexedDB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-notion-border bg-[#202020] px-4 py-3 text-sm">
              <span className="block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                Franja seleccionada
              </span>
              <span className="mt-1 block font-semibold text-notion-text">
                {WEEKLY_DAY_FULL_LABELS[selectedDayIndex]} - {formatTime(selectedStartMinutes)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAchievementsOpen(true)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                summary.pendingAchievementItems > 0
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.18)]'
                  : 'border-notion-border bg-[#202020] text-notion-muted hover:text-notion-text'
              }`}
            >
              <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]">
                <Target size={14} />
                Logros semanales
              </span>
              <span className="mt-1 block text-sm font-semibold">
                {summary.pendingAchievementItems} pendientes / {summary.totalAchievementItems} items
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-notion-border bg-[#15171b] p-4 shadow-2xl">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1">
              <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                Titulo de la franja
              </label>
              <input
                value={draftTitle}
                onChange={event => setDraftTitle(event.target.value)}
                placeholder="Ej: Deep work backend, clase SENA, debugging..."
                className="w-full rounded-xl border border-notion-border bg-[#202020] px-4 py-3 text-sm text-notion-text outline-none transition-colors focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                Dia
              </label>
              <select
                value={selectedDayIndex}
                onChange={event => setSelectedDayIndex(Number(event.target.value))}
                className="rounded-xl border border-notion-border bg-[#202020] px-3 py-3 text-sm text-notion-text outline-none"
              >
                {WEEKLY_DAY_FULL_LABELS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                Inicio
              </label>
              <input
                type="time"
                step={SLOT_MINUTES * 60}
                value={minutesToInputValue(selectedStartMinutes)}
                onChange={event =>
                  setSelectedStartMinutes(
                    clamp(
                      inputValueToMinutes(event.target.value),
                      DAY_START_MINUTES,
                      DAY_END_MINUTES - draftDurationMinutes
                    )
                  )
                }
                className="rounded-xl border border-notion-border bg-[#202020] px-3 py-3 text-sm text-notion-text outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                Duracion
              </label>
              <select
                value={draftDurationMinutes}
                onChange={event => setDraftDurationMinutes(Number(event.target.value))}
                className="rounded-xl border border-notion-border bg-[#202020] px-3 py-3 text-sm text-notion-text outline-none"
              >
                {WEEKLY_DURATION_OPTIONS.map(value => (
                  <option key={value} value={value}>
                    {value >= 60 ? `${value / 60}h` : `${value} min`}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[220px] flex-1">
              <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-notion-muted">
                Nota visual / detalle
              </label>
              <input
                value={draftNotes}
                onChange={event => setDraftNotes(event.target.value)}
                placeholder="Contexto corto opcional"
                className="w-full rounded-xl border border-notion-border bg-[#202020] px-4 py-3 text-sm text-notion-text outline-none transition-colors focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitBlock}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500"
            >
              {editingBlockId ? 'Actualizar franja' : 'Crear franja'}
            </button>

            {editingBlockId && (
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-xl border border-notion-border px-4 py-3 text-sm text-notion-muted transition-colors hover:text-notion-text"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.24em] text-notion-muted">
              Color
            </span>
            {BLOCK_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setDraftColor(color)}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  draftColor === color ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}

            <div className="ml-auto flex flex-wrap gap-3 text-xs text-notion-muted">
              <span className="rounded-full border border-notion-border px-3 py-1">
                {summary.blocks} franjas guardadas
              </span>
              <span className="rounded-full border border-notion-border px-3 py-1">
                {summary.achievements} logros
              </span>
              <span className="rounded-full border border-notion-border px-3 py-1">
                Click en la grilla para prefijar hora y dia
              </span>
            </div>
          </div>
        </div>

        {renderPlannerGrid()}

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'error'
                ? 'border-red-500/60 bg-red-500/10 text-red-200'
                : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {renderAchievementsModal()}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30343b; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4a5160; }
      `}</style>
    </div>
  );
};
