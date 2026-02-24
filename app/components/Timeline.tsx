'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  differenceInDays, format, startOfMonth, addDays, parseISO, endOfMonth, 
  startOfQuarter, endOfQuarter, eachQuarterOfInterval, eachMonthOfInterval, 
  eachDayOfInterval, setDate, isAfter, isBefore, getDaysInMonth, isSameMonth,
  isSameDay 
} from 'date-fns' 
import { 
  DndContext, useDroppable, DragEndEvent, useSensor, useSensors, 
  PointerSensor, TouchSensor, closestCenter 
} from '@dnd-kit/core'
import { 
  SortableContext, verticalListSortingStrategy, arrayMove 
} from '@dnd-kit/sortable' 
import { motion, AnimatePresence } from 'framer-motion' 
import toast, { Toaster } from 'react-hot-toast' 

// --- LIVEBLOCKS IMPORTS ---
import { useOthers, useUpdateMyPresence, useBroadcastEvent, useEventListener } from '@liveblocks/react'

import { useAuth } from '../context/AuthContext' 
import ThemeToggle from './ThemeToggle' 
import AuthBarrierModal from './AuthBarrierModal' 
import ObjexiaLogo from './ObjexiaLogo'
import ConfirmModal from './ConfirmModal' 
import LaneManagerModal from './LaneManagerModal'
import DateRangeSelector from './DateRangeSelector' 
import CustomSelect from './CustomSelect'
import RoadmapItem from './RoadmapItem'
import MilestoneItem from './MilestoneItem'
import SortableSidebar from './SortableSidebar' 
import ItemEditorModal from './ItemEditorModal' 
import ShareModal from './ShareModal' 
import { 
  ITEM_GAP, TOP_PADDING, MILESTONE_STACK_HEIGHT, BASE_ROW_HEIGHT, 
  HEADER_MAIN_HEIGHT, HEADER_SUB_HEIGHT, Group, Milestone, Item, 
  MilestoneData, GroupType 
} from './TimelineConstants'
import { generateCsvContent, parseCsvContent } from '../utils/CsvHelpers'

type TimeView = 'Quarter' | 'Month' | 'Week';
const VIEW_MIN_WIDTHS: Record<TimeView, number> = { Quarter: 30, Month: 60, Week: 120 }
const VIEW_ITEM_HEIGHTS: Record<TimeView, number> = { Quarter: 32, Month: 42, Week: 52 }

function DroppableLane({ groupId, height, rowIndex, headerRows }: { groupId: string, height: number, rowIndex: number, headerRows: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId })
  const rowStart = rowIndex + headerRows + 1;
  return ( 
    <motion.div 
      layout="position" 
      transition={{ type: "spring", stiffness: 400, damping: 40 }} 
      ref={setNodeRef} 
      style={{ gridColumn: '1 / -1', gridRow: rowStart, height: `${height}px`, zIndex: 0 }} 
      className={`col-span-full w-full transition-colors duration-200 ${isOver ? 'bg-slate-100/50 dark:bg-slate-800/50' : 'bg-slate-50/30 dark:bg-[#0f1117]'}`} 
    /> 
  )
}

// --- UPGRADED: CURSORS BLUR BEHIND MODALS ---
function LiveCursors() {
    const others = useOthers();
    
    return (
        <>
            {others.map(({ connectionId, presence, info }: any) => {
                if (!presence?.cursor) return null;
                return (
                    <motion.div
                        key={connectionId}
                        // THE FIX: z-[140] puts it above headers, but perfectly BELOW modals and backdrops!
                        className="absolute top-0 left-0 pointer-events-none z-[140]"
                        animate={{ x: presence.cursor.x, y: presence.cursor.y }}
                        transition={{ type: "spring", damping: 40, mass: 0.5, stiffness: 500 }}
                    >
                        <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                            <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill={info?.color || "#3f407e"} stroke="white" strokeWidth="1.5"/>
                        </svg>
                        
                        <div 
                            className="px-2.5 py-1.5 text-xs font-bold rounded-xl shadow-lg ml-4 mt-1 flex flex-col whitespace-nowrap" 
                            style={{ backgroundColor: info?.color || '#3f407e', color: '#fff' }}
                        >
                            <span>{info?.name || 'Anonymous'}</span>
                            
                            {presence?.activity && (
                                <div className="mt-1 pt-1 border-t border-white/20 text-[10px] font-medium flex items-center gap-1.5 opacity-90">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    {presence.activity}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </>
    );
}

// --- UPGRADED: RICH USER PROFILE HOVER CARDS WITH "CLICK TO TRACK" ---
function ActiveUserAvatar({ info, presence, onJump }: { info: any, presence: any, onJump: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div 
            className="relative cursor-pointer shrink-0"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onClick={() => {
                setIsOpen(!isOpen);
                onJump(); // THE FIX: Click avatar to jump to their mouse!
            }}
            title={`Jump to ${info?.name}`}
        >
            <div 
                className="w-9 h-9 rounded-full border-[3px] border-white dark:border-[#191b19] overflow-hidden shadow-sm z-10 transition-transform hover:scale-110" 
                style={{ backgroundColor: info?.color || '#3f407e' }}
            >
                {/* THE FIX: referrerPolicy ensures Google photos don't 403 error */}
                {info?.avatar 
                    ? <img src={info.avatar} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> 
                    : <div className="w-full h-full flex justify-center items-center text-white text-xs font-bold">{info?.name?.[0] || '?'}</div>
                }
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-[#1e2126] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl z-[200] p-4 origin-top-right"
                    >
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-100 dark:border-slate-800" style={{ backgroundColor: info?.color || '#3f407e' }}>
                                {info?.avatar ? <img src={info.avatar} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="w-full h-full flex justify-center items-center text-white font-bold text-lg">{info?.name?.[0] || '?'}</div>}
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">{info?.name || 'Anonymous'}</div>
                                <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{info?.email || 'Guest User'}</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Current Status</div>
                            {presence?.activity ? (
                                <div className="text-xs text-[#3f407e] dark:text-[#b3bbea] font-bold flex items-center gap-2 bg-[#3f407e]/10 dark:bg-[#b3bbea]/10 p-2.5 rounded-xl leading-tight border border-[#3f407e]/20 dark:border-[#b3bbea]/20">
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3f407e] dark:bg-[#b3bbea] opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3f407e] dark:bg-[#b3bbea]"></span>
                                    </span>
                                    <span className="truncate">{presence.activity}</span>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 font-medium flex items-center gap-2 px-1">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    Viewing board
                                </div>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center opacity-70">
                            Click to jump to cursor
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

type Props = { roadmapId: string; }

export default function Timeline({ roadmapId }: Props) {
  const router = useRouter(); 
  const { user, isLoading: authLoading } = useAuth() 
  
  // --- LIVEBLOCKS HOOKS ---
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  const broadcast = useBroadcastEvent();

  const [roadmapTitle, setRoadmapTitle] = useState('Loading...')
  const [isLoading, setIsLoading] = useState(true)
  
  const [userRole, setUserRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER' | null>(null);
  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false) 
  const [laneManagerMode, setLaneManagerMode] = useState<'add' | 'manage' | null>(null)
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null) 
  
  const [timeView, setTimeView] = useState<TimeView>('Month')
  const [showWeekends, setShowWeekends] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: '2026-12-31' })
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const sidebarWidth = sidebarOpen ? 260 : 0;
  
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [currentMilestoneData, setCurrentMilestoneData] = useState<MilestoneData | null>(null)
  const [isAuthBarrierOpen, setIsAuthBarrierOpen] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [pendingImportData, setPendingImportData] = useState<{ groups: Group[], items: Item[], milestones: Milestone[] } | null>(null)
  
  const [shakeButton, setShakeButton] = useState(false);

  // Global state to detect if ANY modal is open (so we don't delete their cursor when they type!)
  const isAnyModalOpen = isModalOpen || milestoneModalOpen || laneManagerMode !== null || isShareModalOpen || importConfirmOpen;

  const roadmapStart = useMemo(() => parseISO(dateRange.start), [dateRange.start]);
  const roadmapEnd = useMemo(() => parseISO(dateRange.end), [dateRange.end]);
  
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null) 
  const todayRef = useRef<HTMLDivElement>(null) 
  
  const [containerWidth, setContainerWidth] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const totalDays = differenceInDays(roadmapEnd, roadmapStart) + 1
  
  const saveRoadmapSettings = useCallback(async (payload: any) => {
      if (!roadmapId || !canEdit) return; 
      try {
          await fetch(`/api/roadmaps/${roadmapId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          broadcast({ type: 'REFETCH' }); 
      } catch (e) {
          console.error("Failed to auto-save view settings", e);
      }
  }, [roadmapId, canEdit, broadcast]);

  useEffect(() => {
    if (!isLoading && (items.length > 0 || milestones.length > 0 || groups.length > 0)) {
        const event = new CustomEvent('objexia-roadmap-data', { detail: { items, milestones, groups } });
        window.dispatchEvent(event);
    }
    return () => {
        window.dispatchEvent(new CustomEvent('objexia-roadmap-data', { detail: { items: [], milestones: [], groups: [] } }));
    };
  }, [items, milestones, groups, isLoading]);

  const todayColumnIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(roadmapStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(roadmapEnd);
    end.setHours(0, 0, 0, 0);

    if ((isAfter(today, start) || isSameDay(today, start)) && (isBefore(today, end) || isSameDay(today, end))) {
        return differenceInDays(today, start) + 2;
    }
    return null;
  }, [roadmapStart, roadmapEnd]);

  const handleJumpToToday = () => {
      if (!todayColumnIndex) {
          setShakeButton(true);
          setTimeout(() => setShakeButton(false), 500);
          toast.error("Today's date is outside this roadmap's range", { icon: '📅' });
          return;
      }

      if (todayRef.current && containerRef.current) {
          const container = containerRef.current;
          const line = todayRef.current;
          const scrollLeft = line.offsetLeft - (container.clientWidth / 2) + (line.clientWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
  };

  // --- THE FIX: JUMP TO OTHER USER'S CURSOR ---
  const handleJumpToUser = (x: number, name: string) => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      // Subtract half the screen width so the cursor is perfectly centered!
      const scrollLeft = x - (container.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      toast(`Located ${name}`, { icon: '📍', id: 'jump-toast' });
  };

  const columnWidth = useMemo(() => { 
    if (containerWidth === 0) return VIEW_MIN_WIDTHS[timeView]; 
    const availableSpace = containerWidth - sidebarWidth; 
    const stretchedWidth = availableSpace / totalDays; 
    return Math.max(VIEW_MIN_WIDTHS[timeView], stretchedWidth); 
  }, [containerWidth, totalDays, timeView, sidebarWidth]);
  
  const cornerLabels = useMemo(() => { 
    if (timeView === 'Quarter') return { top: 'QUARTER', middle: 'MONTH', bottom: 'DAY' }; 
    if (timeView === 'Week') return { top: 'MONTH', middle: 'WEEK', bottom: 'DAY' }; 
    return { top: 'MONTH', bottom: 'DAY' } 
  }, [timeView])
  
  const isThreeRowHeader = timeView === 'Week' || timeView === 'Quarter';
  const headerRowsCount = isThreeRowHeader ? 3 : 2;
  const isWeekly = timeView === 'Week';
  const milestoneStackHeight = isWeekly ? 72 : 48;
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 }, disabled: !canEdit }), 
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 }, disabled: !canEdit })
  )

  const loadRoadmapData = useCallback(async (silent = false) => {
    if (!roadmapId || !user?.id) return;
    if (!silent) setIsLoading(true);
    
    try { 
      const res = await fetch(`/api/roadmaps/${roadmapId}?userId=${user.id}&t=${Date.now()}`, { cache: 'no-store' }); 
      
      if (res.ok) { 
        const data = await res.json(); 
        setRoadmapTitle(data.title); 
        if (data.lanes) setGroups(data.lanes); 
        if (data.items) setItems(data.items); 
        if (data.milestones) setMilestones(data.milestones); 
        if (data.startDate && data.endDate) { setDateRange({ start: data.startDate, end: data.endDate }); }
        if (data.timeView) setTimeView(data.timeView as TimeView);
        if (data.showWeekends !== undefined) setShowWeekends(data.showWeekends);
        
        setUserRole(data.currentUserRole); 

      } else if (res.status === 401 || res.status === 403) {
        toast.error("You don't have permission to view this board.");
        router.push('/dashboard');
      }
    } catch (e) { 
        toast.error("Failed to load roadmap data"); 
    } finally { 
        if (!silent) setIsLoading(false); 
    }
  }, [roadmapId, user, router]);

  useEffect(() => {
    if (!authLoading) {
        if (user) { loadRoadmapData(); } 
        else { setIsAuthBarrierOpen(true); setIsLoading(false); }
    }
  }, [authLoading, user, loadRoadmapData]);

  useEventListener(({ event }) => {
    const liveEvent = event as { type: string }; 
    if (liveEvent.type === 'REFETCH') {
        loadRoadmapData(true); 
    }
  });

  useEffect(() => {
    const savedSidebar = localStorage.getItem('objexia_sidebar_state');
    if (savedSidebar !== null) setSidebarOpen(savedSidebar === 'true');
    const resizeObserver = new ResizeObserver((entries) => { for (let entry of entries) setContainerWidth(entry.contentRect.width) })
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, []);

  const toggleSidebar = () => { const newState = !sidebarOpen; setSidebarOpen(newState); localStorage.setItem('objexia_sidebar_state', String(newState)); }
  const checkAuth = (action: () => void) => { if (user) { action(); } else { setIsAuthBarrierOpen(true); } }

  const closeAllModals = () => {
      setIsModalOpen(false);
      setMilestoneModalOpen(false);
      setLaneManagerMode(null);
      setIsShareModalOpen(false);
      setEditingItem(null);
      setCurrentMilestoneData(null);
      updateMyPresence({ activity: null }); 
  }

  const handleDateChange = (type: 'start' | 'end', date: string) => {
      const newRange = { ...dateRange, [type]: date };
      setDateRange(newRange);
      if (newRange.start && newRange.end) { saveRoadmapSettings({ startDate: newRange.start, endDate: newRange.end }); }
  };

  const handleTimeViewChange = (val: string) => { setTimeView(val as TimeView); saveRoadmapSettings({ timeView: val }); };
  const handleWeekendToggle = () => { const newVal = !showWeekends; setShowWeekends(newVal); saveRoadmapSettings({ showWeekends: newVal }); };

  const handleReorderLanes = async (newGroups: Group[]) => {
      if (!canEdit) return;
      const previousGroups = [...groups];
      setGroups(newGroups); 
      try { 
        const updates = newGroups.map((g, idx) => ({ id: g.id, order: idx })); 
        await fetch('/api/lanes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lanes: updates }) }); 
        toast.success("Tracks reordered", { id: 'reorder-lanes' });
        broadcast({ type: 'REFETCH' }); 
      } catch (e) { setGroups(previousGroups); toast.error("Failed to reorder lanes"); }
  }

  const handleCreateLane = async (title: string, color: string, type: GroupType) => {
    if (!canEdit) return;
    try { 
      const res = await fetch('/api/lanes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, color, roadmapId, order: groups.length, type }) }); 
      const data = await res.json(); 
      if (res.ok) { 
          setGroups([...groups, data.lane]); 
          toast.success("Track created"); 
          broadcast({ type: 'REFETCH' }); 
      }
    } catch (e) { toast.error("Failed to create track"); }
  }

  const handleUpdateLane = async (id: string, data: any) => {
    if (!canEdit) return;
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
    try { 
        await fetch(`/api/lanes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); 
        toast.success("Track updated"); 
        broadcast({ type: 'REFETCH' }); 
    } catch (e) { toast.error("Failed to update track"); }
  }

  const handleDeleteLane = async (id: string) => {
    if (!canEdit) return;
    setGroups(prev => prev.filter(g => g.id !== id)); setLaneManagerMode(null);
    try { 
        await fetch(`/api/lanes/${id}`, { method: 'DELETE' }); 
        toast.success("Track deleted"); 
        broadcast({ type: 'REFETCH' }); 
    } catch (e) { toast.error("Failed to delete track"); }
  }

  const handleSaveItem = async (itemData: any) => {
    if (!canEdit) return;
    const isUpdate = !!editingItem; 
    const itemId = isUpdate ? editingItem.id : (itemData.id || Math.random().toString());
    const trackIndex = isUpdate ? editingItem.trackIndex : (itemData.trackIndex || 0);
    const optimisticItem = { ...itemData, id: itemId, trackIndex };
    if (isUpdate) { setItems(prev => prev.map(i => i.id === itemId ? optimisticItem : i)); } 
    else { setItems(prev => [...prev, optimisticItem]); }
    closeAllModals(); 
    try { 
      const method = isUpdate ? 'PATCH' : 'POST'; 
      const url = isUpdate ? `/api/items/${itemId}` : '/api/items'; 
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...itemData, roadmapId, trackIndex }) }); 
      if (!res.ok) throw new Error();
      toast.success(isUpdate ? "Item updated" : "Item created");
      broadcast({ type: 'REFETCH' }); 
    } catch (error) { toast.error("Failed to save item"); }
  }

  const handleDeleteItem = async () => { 
    if (!canEdit || !editingItem) return; const id = editingItem.id; setItems(prev => prev.filter(i => i.id !== id)); closeAllModals(); 
    try { 
        await fetch(`/api/items/${id}`, { method: 'DELETE' }); 
        toast.success("Item deleted"); 
        broadcast({ type: 'REFETCH' }); 
    } catch (e) { toast.error("Failed to delete item"); } 
  }
  
  const handleSaveMilestone = async (data: any) => { 
      if (!canEdit) return;
      const isNew = !data.id; const optimistic = { ...data, id: data.id || Math.random().toString(), trackIndex: data.trackIndex || 0, roadmapId } as Milestone; 
      if (!isNew) setMilestones(prev => prev.map(m => m.id === optimistic.id ? optimistic : m)); else setMilestones(prev => [...prev, optimistic]); 
      closeAllModals(); 
      try { 
          const method = isNew ? 'POST' : 'PATCH'; const url = isNew ? '/api/milestones' : `/api/milestones/${data.id}`; 
          await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, roadmapId }) }); 
          toast.success(isNew ? "Milestone added" : "Milestone updated");
          broadcast({ type: 'REFETCH' }); 
      } catch (e) { toast.error("Failed to save milestone"); } 
  }

  const handleDeleteMilestone = async (id: string) => { 
    if (!canEdit) return;
    setMilestones(prev => prev.filter(m => m.id !== id)); closeAllModals(); 
    try { 
        await fetch(`/api/milestones/${id}`, { method: 'DELETE' }); 
        toast.success("Milestone deleted"); 
        broadcast({ type: 'REFETCH' }); 
    } catch (e) { toast.error("Failed to delete milestone"); } 
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!user) { setIsAuthBarrierOpen(true); return; }
    if (!canEdit) return;

    const { active, delta, over } = event;
    const activeIdStr = active.id.toString();

    if (activeIdStr.startsWith('resize-left-') || activeIdStr.startsWith('resize-right-')) {
        const isLeft = activeIdStr.startsWith('resize-left-');
        const itemId = activeIdStr.replace(isLeft ? 'resize-left-' : 'resize-right-', '');
        const daysMoved = Math.round(delta.x / columnWidth);
        if (daysMoved !== 0) {
            const item = items.find(i => i.id === itemId); if (!item) return;
            const newDate = addDays(parseISO(isLeft ? item.startDate : item.endDate), daysMoved);
            let updatedItem = { ...item };
            if (isLeft) { const endDate = parseISO(item.endDate); updatedItem.startDate = format(isAfter(newDate, endDate) ? endDate : newDate, 'yyyy-MM-dd'); } else { const startDate = parseISO(item.startDate); updatedItem.endDate = format(isBefore(newDate, startDate) ? startDate : newDate, 'yyyy-MM-dd'); }
            setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
            try { 
                await fetch(`/api/items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate: updatedItem.startDate, endDate: updatedItem.endDate }) }); 
                toast.success("Item resized", { id: 'resize-item' }); 
                broadcast({ type: 'REFETCH' }); 
            } catch(e) { toast.error("Failed to resize item"); }
        }
        return;
    }
    if (groups.find(g => g.id === active.id) && over && active.id !== over.id) {
        const oldIndex = groups.findIndex(g => g.id === active.id); const newIndex = groups.findIndex(g => g.id === over.id);
        const newGroups = arrayMove(groups, oldIndex, newIndex); handleReorderLanes(newGroups); return;
    }
    const milestone = milestones.find(m => m.id === active.id);
    if (milestone) {
        if (!over) return;
        const daysMoved = Math.round(delta.x / columnWidth); const trackSteps = Math.round(delta.y / MILESTONE_STACK_HEIGHT);
        const newDate = addDays(parseISO(milestone.date), daysMoved); const newTrackIndex = Math.max(0, (milestone.trackIndex || 0) + trackSteps);
        const optimisticMilestone = { ...milestone, date: format(newDate, 'yyyy-MM-dd'), trackIndex: newTrackIndex };
        setMilestones(prev => prev.map(m => m.id === milestone.id ? optimisticMilestone : m));
        try { 
            await fetch(`/api/milestones/${milestone.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: optimisticMilestone.date, trackIndex: optimisticMilestone.trackIndex }) }); 
            toast.success("Milestone moved", { id: 'move-milestone' }); 
            broadcast({ type: 'REFETCH' }); 
        } catch (e) { toast.error("Failed to move milestone"); }
        return;
    }
    if (!over) return;
    const daysMoved = Math.round(delta.x / columnWidth); const item = items.find(i => i.id === active.id);
    if (item) {
        const newStart = addDays(parseISO(item.startDate), daysMoved); const newEnd = addDays(parseISO(item.endDate), daysMoved);
        const targetGroup = groups.find(g => g.id === over.id); let newGroupId = item.groupId; let newTrackIndex = item.trackIndex;
        if (targetGroup && targetGroup.id !== item.groupId && targetGroup.type !== 'milestone') { newGroupId = targetGroup.id; newTrackIndex = 0; } else { const trackSteps = Math.round(delta.y / (VIEW_ITEM_HEIGHTS[timeView] + ITEM_GAP)); newTrackIndex = Math.max(0, item.trackIndex + trackSteps); }
        const optimistic = { ...item, startDate: format(newStart, 'yyyy-MM-dd'), endDate: format(newEnd, 'yyyy-MM-dd'), trackIndex: newTrackIndex, groupId: newGroupId };
        setItems(prev => prev.map(i => i.id === item.id ? optimistic : i));
        try { 
            await fetch(`/api/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate: optimistic.startDate, endDate: optimistic.endDate, trackIndex: optimistic.trackIndex, groupId: optimistic.groupId }) }); 
            toast.success("Item moved", { id: 'move-item' }); 
            broadcast({ type: 'REFETCH' }); 
        } catch(e) { toast.error("Failed to move item"); }
    }
  }

  const handleExport = () => { checkAuth(() => { const csv = generateCsvContent(groups, items, milestones); const blob = new Blob([csv], {type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='roadmap.csv'; a.click(); }) }
  const handleImportClick = () => { if (!canEdit) return; checkAuth(() => fileInputRef.current?.click()) }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file=e.target.files?.[0]; if(!file)return; const r=new FileReader(); r.onload=(ev)=>{ const t=ev.target?.result; if(typeof t==='string'){ try { const p=parseCsvContent(t); if(p.groups.length>0){ setPendingImportData(p); setImportConfirmOpen(true); } else { toast.error("No valid data found in CSV"); } } catch(e) { toast.error("Invalid CSV format"); } } }; r.readAsText(file); e.target.value=''; }
  
  const confirmImport = async () => { 
      if(pendingImportData){ 
          try {
              const res = await fetch(`/api/roadmaps/${roadmapId}/import`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(pendingImportData)
              });
              if (!res.ok) throw new Error("Failed to save imported data");

              setGroups(pendingImportData.groups); 
              setItems(pendingImportData.items); 
              setMilestones(pendingImportData.milestones); 
              setImportConfirmOpen(false); 
              setPendingImportData(null); 
              toast.success("Roadmap imported successfully"); 
              broadcast({ type: 'REFETCH' });
          } catch(e) {
              toast.error("Failed to import CSV to database");
          }
      } 
  }
  
  // MODAL HANDLERS EMITTING LIVE ACTIVITY
  const handleEditLane = (group: Group) => { if (!canEdit) return; checkAuth(() => { setEditingLaneId(group.id); setLaneManagerMode('manage'); updateMyPresence({ activity: `Configuring Tracks` }); }) }
  const openNewItemModal = () => { if (!canEdit) return; checkAuth(() => { setEditingItem(null); setIsModalOpen(true); updateMyPresence({ activity: `Creating new initiative` }); }) }
  const handleItemClick = (item: Item) => { if (!canEdit) return; checkAuth(() => { setEditingItem(item); setIsModalOpen(true); updateMyPresence({ activity: `Editing: ${item.title}` }); }) }
  const handleMilestoneClick = (dayIndex: number, groupId: string) => { if (!canEdit) return; checkAuth(() => { const date = addDays(roadmapStart, dayIndex); setCurrentMilestoneData({ title: '', date: format(date, 'yyyy-MM-dd'), groupId, icon: 'diamond', color: 'text-slate-600', roadmapId }); setMilestoneModalOpen(true); updateMyPresence({ activity: `Adding milestone` }); }) }
  const handleEditMilestone = (milestone: Milestone) => { if (!canEdit) return; checkAuth(() => { setCurrentMilestoneData(milestone); setMilestoneModalOpen(true); updateMyPresence({ activity: `Editing: ${milestone.title}` }); }) }

  const layout = useMemo(() => {
    const visualPositions: Record<string, number> = {}; const groupHeights: Record<string, number> = {}; const currentItemHeight = VIEW_ITEM_HEIGHTS[timeView];
    groups.forEach(group => {
        if (group.type === 'milestone') {
            const groupMilestones = milestones.filter(m => m.groupId === group.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); const filledTracks: Record<number, number[]> = {};
            groupMilestones.forEach(m => { const mDate = new Date(m.date).getTime(); let currentTrack = m.trackIndex || 0; let placed = false; while (!placed) { const occupied = filledTracks[currentTrack] || []; const hasCollision = occupied.some(d => Math.ceil(Math.abs(d - mDate) / 86400000) < 3); if (!hasCollision) { if (!filledTracks[currentTrack]) filledTracks[currentTrack] = []; filledTracks[currentTrack].push(mDate); visualPositions[m.id] = currentTrack; placed = true; } else currentTrack++; } });
            const maxTrack = Object.keys(filledTracks).length > 0 ? Math.max(...Object.keys(filledTracks).map(Number)) : 0; groupHeights[group.id] = Math.max(TOP_PADDING + ((maxTrack + 2) * milestoneStackHeight) + TOP_PADDING, 140); return;
        }
        const groupItems = items.filter(i => i.groupId === group.id).sort((a, b) => a.trackIndex - b.trackIndex || new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); const filledTracks: Record<number, {start: number, end: number}[]> = {};
        groupItems.forEach(item => { const itemStart = new Date(item.startDate).getTime(); const itemEnd = new Date(item.endDate).getTime(); let currentTrack = item.trackIndex; let placed = false; while (!placed) { const existing = filledTracks[currentTrack] || []; const hasCollision = existing.some(e => (itemStart <= e.end && itemEnd >= e.start)); if (!hasCollision) { if (!filledTracks[currentTrack]) filledTracks[currentTrack] = []; filledTracks[currentTrack].push({ start: itemStart, end: itemEnd }); visualPositions[item.id] = currentTrack; placed = true; } else currentTrack++; } });
        const maxTrackKeys = Object.keys(filledTracks).map(Number); const absoluteMax = maxTrackKeys.length > 0 ? Math.max(...maxTrackKeys) : 0; groupHeights[group.id] = Math.max(TOP_PADDING + ((absoluteMax + 2) * (currentItemHeight + ITEM_GAP)) + TOP_PADDING, BASE_ROW_HEIGHT);
    });
    return { visualPositions, groupHeights };
  }, [items, groups, milestones, milestoneStackHeight, timeView]);

  const getLineStyles = (date: Date, view: TimeView, isFirst: boolean) => {
      const dayOfWeek = date.getDay(); const isWeekendDay = dayOfWeek === 5 || dayOfWeek === 6; const bgClass = (showWeekends && isWeekendDay) ? 'bg-slate-100 dark:bg-[#22252a]' : ''; 
      return { border: 'border-l border-slate-200 dark:border-slate-800', rowStart: 1, bg: bgClass };
  }
  
  const renderMainHeaders = () => {
    if (timeView === 'Quarter') {
        const quarters = eachQuarterOfInterval({ start: roadmapStart, end: roadmapEnd }); return quarters.map((q, i) => { const qStart = startOfQuarter(q) < roadmapStart ? roadmapStart : startOfQuarter(q); const qEnd = endOfQuarter(q) > roadmapEnd ? roadmapEnd : endOfQuarter(q); const daysSpan = differenceInDays(qEnd, qStart) + 1; const colStart = differenceInDays(qStart, roadmapStart) + 2; if (daysSpan <= 0) return null; const styles = getLineStyles(qStart, timeView, i === 0); 
        return ( <div key={i} className={`flex items-center px-2 font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[11px] ${styles.border} border-b border-slate-200 dark:border-slate-800 h-[48px] sticky top-0 z-[110] bg-white dark:bg-[#191b19] truncate shadow-sm`} style={{ gridColumnStart: colStart, gridColumnEnd: `span ${daysSpan}`, gridRow: 1 }}> <span className={`sticky left-[${sidebarWidth + 10}px] transition-all duration-500`}>{format(q, 'QQQ yyyy')}</span> </div> ) })
    }
    const months = eachMonthOfInterval({ start: roadmapStart, end: roadmapEnd }); return months.map((m, i) => { const mStart = startOfMonth(m) < roadmapStart ? roadmapStart : startOfMonth(m); const mEnd = endOfMonth(m) > roadmapEnd ? roadmapEnd : endOfMonth(m); const daysSpan = differenceInDays(mEnd, mStart) + 1; const colStart = differenceInDays(mStart, roadmapStart) + 2; if (daysSpan <= 0) return null; const styles = getLineStyles(mStart, timeView, i === 0); 
    return ( <div key={i} className={`flex items-center px-4 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[11px] ${styles.border} border-b border-slate-200 dark:border-slate-800 h-[48px] sticky top-0 z-[110] bg-white dark:bg-[#191b19] shadow-sm`} style={{ gridColumnStart: colStart, gridColumnEnd: `span ${daysSpan}`, gridRow: 1 }}> <span className={`sticky left-[${sidebarWidth + 10}px] whitespace-nowrap transition-all duration-500`}>{format(m, 'MMMM yyyy')}</span> </div> ) })
  }
  
  const renderMiddleHeaders = () => {
    if (timeView === 'Month') return null;
    if (timeView === 'Quarter') { const months = eachMonthOfInterval({ start: roadmapStart, end: roadmapEnd }); return months.map((m, i) => { const mStart = startOfMonth(m) < roadmapStart ? roadmapStart : startOfMonth(m); const mEnd = endOfMonth(m) > roadmapEnd ? roadmapEnd : endOfMonth(m); const daysSpan = differenceInDays(mEnd, mStart) + 1; const colStart = differenceInDays(mStart, roadmapStart) + 2; if (daysSpan <= 0) return null; const isFirst = i === 0 && mStart.getDate() === roadmapStart.getDate(); const borderClass = isFirst ? 'border-l border-transparent' : 'border-l border-slate-300 dark:border-slate-700'; 
    return ( <div key={`qm-${i}`} className={`flex items-center px-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#1e2126] ${borderClass} border-b border-slate-200 dark:border-slate-800 sticky top-[48px] z-[115] h-[32px]`} style={{ gridColumnStart: colStart, gridColumnEnd: `span ${daysSpan}`, gridRow: 2 }}> <span className={`sticky left-[${sidebarWidth + 10}px] whitespace-nowrap transition-all duration-500`}>{format(m, 'MMMM')}</span> </div> ) }) }
    if (timeView === 'Week') { const months = eachMonthOfInterval({ start: roadmapStart, end: roadmapEnd }); const weekElements: any[] = []; months.forEach((m) => { const daysInMonth = getDaysInMonth(m); const ranges = [{ start: 1, end: 7 }, { start: 8, end: 14 }, { start: 15, end: 21 }, { start: 22, end: 28 }, { start: 29, end: daysInMonth }]; ranges.forEach((range, idx) => { const startD = setDate(m, range.start); const endD = setDate(m, range.end); if (isAfter(startD, roadmapEnd) || isBefore(endD, roadmapStart)) return; const effectiveStart = isBefore(startD, roadmapStart) ? roadmapStart : startD; const effectiveEnd = isAfter(endD, roadmapEnd) ? roadmapEnd : endD; const daysSpan = differenceInDays(effectiveEnd, effectiveStart) + 1; const colStart = differenceInDays(effectiveStart, roadmapStart) + 2; if (daysSpan <= 0) return; const label = `Week ${idx + 1}`; const borderClass = range.start === 1 ? 'border-l border-slate-300 dark:border-slate-700' : 'border-l border-slate-200 dark:border-slate-800'; const finalBorder = (idx === 0 && isSameMonth(effectiveStart, roadmapStart) && effectiveStart.getDate() === roadmapStart.getDate()) ? 'border-l border-transparent' : borderClass; 
    weekElements.push( <div key={`wk-${m.toString()}-${range.start}`} className={`flex items-center px-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#1e2126] ${finalBorder} border-b border-slate-200 dark:border-slate-800 sticky top-[48px] z-[115] h-[32px]`} style={{ gridColumnStart: colStart, gridColumnEnd: `span ${daysSpan}`, gridRow: 2 }}> <span className={`sticky left-[${sidebarWidth + 10}px] whitespace-nowrap transition-all duration-500`}>{label}</span> </div> ); }); }); return weekElements; }
  }
  
  const renderSubHeaders = () => { const row = isThreeRowHeader ? 3 : 2; const stickyTop = isThreeRowHeader ? 'top-[80px]' : 'top-[48px]'; const days = eachDayOfInterval({ start: roadmapStart, end: roadmapEnd }); return days.map((d, i) => { const colStart = i + 2; const styles = getLineStyles(d, timeView, i === 0); const label = timeView === 'Quarter' ? format(d, 'd') : (timeView === 'Month' ? format(d, 'd EEE') : format(d, 'EEE d')); const isWeekend = styles.bg !== ''; const headerBg = isWeekend ? 'bg-slate-100 dark:bg-[#22252a]' : 'bg-white dark:bg-[#191b19]'; 
  return ( <div key={`d-${i}`} className={`flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-400 ${styles.border} border-b-2 border-slate-200 dark:border-slate-700 ${headerBg} h-[32px] sticky ${stickyTop} z-[120] whitespace-nowrap overflow-hidden px-1 shadow-sm`} style={{ gridColumnStart: colStart, gridColumnEnd: `span 1`, gridRow: row }}> {label} </div> ) }) }

  const headerCSS = isThreeRowHeader ? `${HEADER_MAIN_HEIGHT}px ${HEADER_SUB_HEIGHT}px ${HEADER_SUB_HEIGHT}px` : `${HEADER_MAIN_HEIGHT}px ${HEADER_SUB_HEIGHT}px`;
  const gridRowsCSS = `${headerCSS} ${groups.map(g => `${layout.groupHeights[g.id]}px`).join(' ')} 80px`; 

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col h-[100dvh] w-full bg-white dark:bg-[#191b19] font-sans overflow-hidden transition-colors"
    >
      
      {/* --- TOP NAVBAR --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 gap-4 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-[#191b19]/70 backdrop-blur-xl backdrop-saturate-150 z-[150] relative">
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all duration-300 relative z-10"
            title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            <div className={`transform transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`}>
                {sidebarOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                )}
            </div>
          </button>
          
          <Link href="/dashboard" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 group transition-colors relative z-10">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-md group-hover:text-[#3f407e] text-slate-700 dark:text-slate-400 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </div>
            <span className="text-sm font-bold hidden md:inline text-slate-900 dark:text-[#b3bbea] group-hover:text-[#3f407e]">Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 relative z-10">
            <ObjexiaLogo className="w-8 h-8" />
            <h1 className="text-xl font-extrabold truncate max-w-[200px] text-slate-900 dark:text-white leading-tight tracking-tight">{roadmapTitle}</h1>
            {userRole === 'VIEWER' && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest rounded-md ml-2">Read-Only</span>
            )}
          </div>
          
          <div className={`flex items-center gap-2 relative z-10 ${!canEdit ? 'pointer-events-none opacity-60 grayscale-[30%]' : ''}`}>
              <DateRangeSelector 
                startDate={dateRange.start} 
                endDate={dateRange.end} 
                onChangeStart={(d) => handleDateChange('start', d)} 
                onChangeEnd={(d) => handleDateChange('end', d)} 
              />
              
              <div className="w-[120px]">
                  <CustomSelect 
                      value={timeView} 
                      onChange={handleTimeViewChange} 
                      options={[{ label: 'Quarterly', value: 'Quarter' }, { label: 'Monthly', value: 'Month' }, { label: 'Weekly', value: 'Week' }]} 
                  />
              </div>
              
              <button 
                  onClick={handleWeekendToggle} 
                  className={`p-2.5 rounded-xl border transition-colors ${
                      showWeekends 
                          ? 'bg-[#3f407e]/10 border-[#3f407e]/20 text-[#3f407e] dark:bg-[#b3bbea]/10 dark:border-[#b3bbea]/20 dark:text-[#b3bbea]' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  title="Toggle Weekends"
              >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </button>
          </div>

          <motion.button 
              onClick={handleJumpToToday}
              animate={shakeButton ? { x: [0, -5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`p-2.5 rounded-xl border transition-all ml-2 relative z-10 ${
                  shakeButton 
                      ? 'bg-red-100 border-red-300 text-red-500 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#3f407e] dark:hover:text-[#b3bbea] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Jump to Today"
          >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="12" y1="2" x2="12" y2="4"></line>
                  <line x1="12" y1="20" x2="12" y2="22"></line>
                  <line x1="2" y1="12" x2="4" y2="12"></line>
                  <line x1="20" y1="12" x2="22" y2="12"></line>
              </svg>
          </motion.button>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          
          {/* --- ACTIVE USERS AVATAR HOVER STACK --- */}
          {others.length > 0 && (
            <div className="flex items-center -space-x-3 mr-2 pr-4 border-r border-slate-200 dark:border-slate-700">
                {others.slice(0, 3).map(({ connectionId, info, presence }: any) => (
                    <ActiveUserAvatar 
                        key={connectionId} 
                        info={info} 
                        presence={presence} 
                        onJump={() => {
                            if (presence?.cursor) {
                                handleJumpToUser(presence.cursor.x, info?.name || 'User');
                            } else {
                                toast.error(`${info?.name || 'User'} is currently inactive on the board`);
                            }
                        }}
                    />
                ))}
                {others.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#191b19] bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center z-0">
                        +{others.length - 3}
                    </div>
                )}
            </div>
          )}

          <div className="hidden md:flex gap-2">
                <button onClick={handleExport} className="p-2.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export
                </button>
                {canEdit && (
                    <button onClick={handleImportClick} className="p-2.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Import
                    </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".csv" />
          </div>

          {userRole === 'OWNER' && (
              <button 
                  onClick={() => checkAuth(() => { setIsShareModalOpen(true); updateMyPresence({ activity: 'Managing Permissions' }); })} 
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm"
              >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  Share
              </button>
          )}

          <ThemeToggle />
          {user && (<Link href={`/profile?from=/roadmap/${roadmapId}`}><div className="w-9 h-9 rounded-full bg-[#b3bbea] dark:bg-[#3f407e] border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden hover:scale-110 transition-transform">{user.avatarUrl ? <img src={user.avatarUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs font-bold text-[#3f407e] dark:text-white">{user.firstName[0]}</div>}</div></Link>)}
          
          {canEdit && (
              <button 
                onClick={openNewItemModal} 
                className="
                    relative overflow-hidden group
                    px-5 py-2.5 rounded-xl font-bold text-sm
                    bg-[#3f407e] text-white
                    shadow-[0_4px_14px_0_rgb(63,64,126,0.39)] 
                    hover:shadow-[0_6px_20px_rgba(63,64,126,0.23)] 
                    hover:-translate-y-[1px]
                    active:scale-95 active:shadow-inner
                    transition-all duration-200 ease-out
                "
                >
                <span className="relative z-10 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 5v14M5 12h14"/>
                    </svg> 
                    New 
                </span>
                <div className="absolute inset-0 h-full w-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              </button>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-slate-50/50 dark:bg-[#191b19] custom-scrollbar"
        onPointerMove={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const rect = canvas.getBoundingClientRect();
            
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const x = Math.round(e.clientX - rect.left);
                const y = Math.round(e.clientY - rect.top);
                updateMyPresence({ cursor: { x, y } });
            } else {
                if (!isAnyModalOpen) updateMyPresence({ cursor: null });
            }
        }}
        onPointerLeave={() => {
            if (!isAnyModalOpen) updateMyPresence({ cursor: null });
        }}
      >
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div 
                    key="timeline-skeleton"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col overflow-hidden animate-pulse h-full"
                >
                    <div className="h-[48px] w-full border-b border-slate-200 dark:border-slate-800 flex bg-white/50 dark:bg-[#191b19]/50">
                        <div className="w-[260px] border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50" />
                        <div className="flex-1" />
                    </div>
                    <div className="flex-1 flex">
                        <div className="w-[260px] border-r border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-white dark:bg-[#191b19]">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-24 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                            ))}
                        </div>
                        <div className="flex-1 relative bg-slate-50/30 dark:bg-[#0f1117] p-8">
                            <div className="absolute inset-0 flex">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="flex-1 border-l border-slate-100 dark:border-slate-800/50" />
                                ))}
                            </div>
                            <div className="relative space-y-20">
                                <div className="h-10 w-1/3 bg-slate-200/50 dark:bg-slate-800/30 rounded-full ml-10" />
                                <div className="h-10 w-1/2 bg-slate-200/50 dark:bg-slate-800/30 rounded-full ml-40" />
                                <div className="h-10 w-1/4 bg-slate-200/50 dark:bg-slate-800/30 rounded-full ml-20" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <DndContext onDragEnd={handleDragEnd} sensors={sensors} collisionDetection={closestCenter}>
                    <motion.div 
                        key="timeline-content"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        ref={canvasRef}
                        className="min-w-max relative"
                    >
                        <LiveCursors />

                        <div 
                            className="grid" 
                            style={{ 
                                gridTemplateColumns: `${sidebarWidth}px repeat(${totalDays}, ${columnWidth}px)`, 
                                gridTemplateRows: gridRowsCSS,
                                transition: "grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}
                        >
                            {/* Base Background */}
                            <div className="bg-white dark:bg-[#191b19]" style={{ gridColumn: '1 / -1', gridRow: `1 / ${groups.length + headerRowsCount + 1}`, zIndex: -1 }} />
                            
                            {/* Fixed Sticky Sidebar Background Strip */}
                            <div className="sticky left-0 z-[60] bg-white dark:bg-[#191b19] border-r border-slate-100 dark:border-slate-800" style={{ gridColumn: 1, gridRow: `1 / ${groups.length + headerRowsCount + 1}` }} />
                            
                            {/* --- ROW 1: MAIN HEADER --- */}
                            <>
                                <div className="sticky left-0 top-0 z-[130] bg-white dark:bg-[#191b19] border-b border-r border-slate-200 dark:border-slate-800 h-[48px] flex items-center justify-center text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider overflow-hidden shadow-sm" style={{ gridColumn: 1, gridRow: 1 }}>{sidebarOpen ? cornerLabels.top : ''}</div> 
                                {renderMainHeaders()} 
                            </>
                            
                            {/* --- ROW 2: MIDDLE HEADER (Conditional) --- */}
                            {isThreeRowHeader && ( 
                                <> 
                                    <div className="sticky left-0 top-[48px] z-[130] bg-slate-50 dark:bg-[#1e2126] border-b border-r border-slate-200 dark:border-slate-800 h-[32px] flex items-center justify-center text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider overflow-hidden" style={{ gridColumn: 1, gridRow: 2 }}> {sidebarOpen ? (cornerLabels as any).middle : ''} </div> 
                                    {renderMiddleHeaders()} 
                                </> 
                            )}
                            
                            {/* --- ROW 3: SUB HEADER --- */}
                            <> 
                                <div className={`sticky left-0 z-[130] bg-white dark:bg-[#191b19] border-b-2 border-r border-slate-200 dark:border-slate-700 h-[32px] flex items-center justify-center text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider overflow-hidden shadow-sm ${isThreeRowHeader ? 'top-[80px]' : 'top-[48px]'}`} style={{ gridColumn: 1, gridRow: isThreeRowHeader ? 3 : 2 }}>{sidebarOpen ? (cornerLabels as any).bottom : ''}</div> 
                                {renderSubHeaders()} 
                            </>
                            
                            {/* Grid Lines */}
                            {Array.from({ length: totalDays }).map((_, i) => { const currentDay = addDays(roadmapStart, i); const styles = getLineStyles(currentDay, timeView, i === 0); return (<div key={i} className={`border-l ${styles.border} ${styles.bg} transition-colors duration-500 ease-in-out pointer-events-none z-[1]`} style={{ gridColumn: i + 2, gridRow: `${styles.rowStart} / ${groups.length + headerRowsCount + 1}` }} />); })}

                            {/* Today Indicator */}
                            {todayColumnIndex && (
                                <div
                                    ref={todayRef}
                                    className="pointer-events-none z-[105] relative h-full w-full"
                                    style={{ gridColumn: `${todayColumnIndex} / span 1`, gridRow: `1 / ${groups.length + headerRowsCount + 2}` }}
                                >
                                    <div className="absolute left-1/2 -translate-x-1/2 h-full w-[2px] bg-[#3f407e] dark:bg-[#b3bbea] shadow-[0_0_15px_rgba(63,64,126,0.8)] dark:shadow-[0_0_20px_rgba(179,184,234,0.9)] animate-pulse">
                                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#3f407e] dark:from-[#b3bbea] to-transparent opacity-50" />
                                    </div>
                                </div>
                            )}

                            {/* Tracks and Items */}
                            <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
                            {groups.map((group, index) => {
                                const currentRow = index + (isThreeRowHeader ? 4 : 3);
                                const isMilestoneRow = group.type === 'milestone';
                                return (
                                <div key={group.id} style={{ display: 'contents' }}>
                                    <DroppableLane groupId={group.id} height={layout.groupHeights[group.id]} rowIndex={index} headerRows={headerRowsCount} />
                                    <SortableSidebar 
                                        group={group} 
                                        sidebarOpen={sidebarOpen} 
                                        isMilestoneRow={isMilestoneRow} 
                                        gridRow={currentRow} 
                                        onEdit={() => handleEditLane(group)} 
                                        laneHeight={layout.groupHeights[group.id]} 
                                    />
                                    <div className="border-b border-slate-100 dark:border-slate-800/80 col-span-full pointer-events-none" style={{ gridRow: currentRow, gridColumn: '2 / -1' }} />
                                    {isMilestoneRow ? (
                                        <>
                                        {Array.from({ length: totalDays }).map((_, i) => ( <div key={`mc-${group.id}-${i}`} onClick={() => handleMilestoneClick(i, group.id)} className="row-span-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors cursor-crosshair z-5" style={{ gridColumn: i + 2, gridRow: currentRow }} /> ))}
                                        {milestones.filter(m => m.groupId === group.id).map(m => ( <MilestoneItem key={m.id} milestone={m} roadmapStart={roadmapStart} roadmapEnd={roadmapEnd} onClick={handleEditMilestone} rowIndex={index} trackIndex={layout.visualPositions[m.id] || 0} headerRows={headerRowsCount} isWeekly={isWeekly} stackHeight={milestoneStackHeight} timeView={timeView} /> ))}
                                        </>
                                    ) : (
                                        items.filter(item => item.groupId === group.id).map((item) => ( 
                                        <RoadmapItem 
                                            key={item.id} 
                                            item={item} 
                                            roadmapStart={roadmapStart} 
                                            roadmapEnd={roadmapEnd} 
                                            groups={groups} 
                                            onClick={handleItemClick} 
                                            rowIndex={index} 
                                            computedTrackIndex={layout.visualPositions[item.id] || 0} 
                                            headerRows={headerRowsCount} 
                                            timeView={timeView as any} 
                                            itemHeight={VIEW_ITEM_HEIGHTS[timeView]}
                                            sidebarWidth={sidebarWidth}
                                        /> 
                                        ))
                                    )}
                                </div>
                            )})}
                            </SortableContext>
                            
                            {/* Track Addition Button row (Hidden for Viewers) */}
                            {canEdit && (
                                <motion.div layout="position" transition={{ type: "spring", stiffness: 400, damping: 40 }} className="sticky left-0 z-50 flex items-center justify-center px-4 py-4 overflow-hidden" style={{ gridColumn: 1, gridRow: groups.length + headerRowsCount + 1, height: '80px' }}>
                                    {sidebarOpen && ( 
                                        <div className="flex w-full min-w-[200px] items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm"> 
                                            <button onClick={() => checkAuth(() => { setEditingLaneId(null); setLaneManagerMode('add'); updateMyPresence({ activity: 'Creating track' }); })} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-[#3f407e] text-[#3f407e] dark:text-white rounded-lg shadow-sm hover:shadow-md transition-all font-bold text-xs border border-slate-200 dark:border-[#3f407e] active:scale-95"> <span className="text-lg leading-none">+</span> <span>Track</span> </button> 
                                            <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-600" />
                                            <button onClick={() => checkAuth(() => { setEditingLaneId(null); setLaneManagerMode('manage'); updateMyPresence({ activity: 'Configuring tracks' }); })} className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-[#3f407e] dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" title="Manage Structure"> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> </button> 
                                        </div> 
                                    )}
                                </motion.div>
                            )}
                            <div className="border-t border-slate-100 dark:border-slate-800 pointer-events-none z-10" style={{ gridRow: groups.length + headerRowsCount + 1, gridColumn: '2 / -1' }} />
                        </div>
                    </motion.div>
                </DndContext>
            )}
        </AnimatePresence>
      </div>
      
      {/* --- MODALS --- */}
      <ItemEditorModal isOpen={isModalOpen || milestoneModalOpen} onClose={closeAllModals} groups={groups} editObjective={editingItem} onSaveObjective={handleSaveItem} onDeleteObjective={handleDeleteItem} editMilestone={currentMilestoneData} onSaveMilestone={handleSaveMilestone} onDeleteMilestone={handleDeleteMilestone} />
      <LaneManagerModal isOpen={laneManagerMode !== null} mode={laneManagerMode || 'manage'} onClose={closeAllModals} groups={groups} onCreateLane={handleCreateLane} onUpdateLane={handleUpdateLane} onDeleteLane={handleDeleteLane} onReorderLanes={handleReorderLanes} onEditLane={handleEditLane} editGroupId={editingLaneId} items={items} milestones={milestones} />
      <AuthBarrierModal isOpen={isAuthBarrierOpen} onClose={closeAllModals} />
      <ConfirmModal isOpen={importConfirmOpen} onClose={closeAllModals} onConfirm={confirmImport} title="Overwrite Roadmap?" message="Importing this file will replace all current data with the contents of the CSV. This action cannot be undone." confirmText="Yes, Import & Overwrite" isDangerous={true} />
      <ShareModal isOpen={isShareModalOpen} onClose={closeAllModals} roadmapId={roadmapId} />
      
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff', fontSize: '14px', borderRadius: '12px' } }} />
    </motion.div>
  )
}