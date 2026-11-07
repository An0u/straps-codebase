import React, { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { Skill } from '@/data/skillTreeData';
import DraggableSkillNode from './DraggableSkillNode';
import ConnectionLines from './ConnectionLines';

// Lazy-load modals — they're only shown on user interaction, not on initial render
const SkillModal = lazy(() => import('./SkillModal'));
const OnboardingModal = lazy(() => import('./OnboardingModal'));
import { useSkillProgress } from '@/hooks/useSkillProgress';
import { useEditableSkillTree } from '@/hooks/useEditableSkillTree';
import { useSheetSkills } from '@/hooks/useSheetSkills';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Minus, Plus, CircleHelp, MessageCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DOT_BASE = 24; // base dot spacing in px at scale 1

interface SkillTreeProps {
  onOpenFeedback?: () => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ onOpenFeedback }) => {
  const isMobile = useIsMobile();
  const [scale, setScale] = useState(isMobile ? 0.5 : 0.8);
  const [position, setPosition] = useState({ x: isMobile ? 50 : -200, y: isMobile ? 50 : -100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  // Onboarding state
  const { 
    showOnboarding, 
    setShowOnboarding, 
    handleOnboardingComplete 
  } = useOnboarding();

  // Delay mounting the onboarding modal until after first paint
  // so it doesn't count as LCP content for Lighthouse/PageSpeed
  const [onboardingMounted, setOnboardingMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setOnboardingMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Defer rendering nodes until after first paint — shows spinner first
  const [treeReady, setTreeReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setTreeReady(true), 50);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pinch zoom refs
  const pinchRef = useRef<{ 
    distance: number; 
    scale: number;
    originX: number;
    originY: number;
  } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasMoved = useRef(false);

  // Live values during gesture - updated every frame without triggering re-renders
  const liveTransform = useRef({ scale: 0, x: 0, y: 0 });

  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  useEffect(() => { 
    scaleRef.current = scale;
    liveTransform.current.scale = scale;
  }, [scale]);
  useEffect(() => { 
    positionRef.current = position;
    liveTransform.current.x = position.x;
    liveTransform.current.y = position.y;
  }, [position]);

  // "Start Here" tooltip — shown until the user clicks any skill for the first time
  const startHereRef = useRef(!localStorage.getItem('straps_has_clicked_skill'));
  const [showStartHere, setShowStartHere] = useState(startHereRef.current);

  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to the inner transform div - we mutate its style directly during gestures
  const transformDivRef = useRef<HTMLDivElement>(null);
  // Apply transform directly to DOM - zero React overhead during gesture.
  // The dot layer lives inside this same transformed container (see render
  // below), so it pans/zooms for free via the GPU-composited transform
  // instead of needing its own per-frame background-position/-size update
  // (which would force a repaint of the full-screen gradient every frame).
  const applyTransformDirect = useCallback((x: number, y: number, s: number) => {
    liveTransform.current = { x, y, scale: s };
    if (transformDivRef.current) {
      transformDivRef.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    }
  }, []);

  const {
    isSkillCompleted,
    isSkillFavorite,
    toggleSkillCompletion,
    toggleSkillFavorite,
    completedSkills,
    getAvailableSkills,
  } = useSkillProgress();

  const { data: sheetSkills } = useSheetSkills();
  const { skills } = useEditableSkillTree(sheetSkills);

  // Derive available skills — memoized so this O(n) parent-map build + ancestor
  // walk only re-runs when skills/completedSkills actually change, not on
  // every unrelated re-render (opening the legend, opening a modal, etc).
  const availableSkills = React.useMemo(
    () => getAvailableSkills(skills),
    [getAvailableSkills, skills]
  );

  // Track container size so culling updates on window resize
  const [containerSize, setContainerSize] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Viewport culling — only render nodes visible in the current viewport
  // Adds a generous 200px buffer so nodes pop in before they're visible
  const visibleSkills = React.useMemo(() => {
    const buffer = 200;
    return skills.filter(skill => {
      const screenX = skill.x * scale + position.x;
      const screenY = skill.y * scale + position.y;
      return (
        screenX > -buffer &&
        screenX < containerSize.w + buffer &&
        screenY > -buffer &&
        screenY < containerSize.h + buffer
      );
    });
  }, [skills, scale, position, containerSize]);

  // Tree bounds — memoized so it only recalculates when skills change.
  // Uses reduce instead of Math.min/max(...spread) to avoid call stack limits on large arrays.
  const treeBounds = React.useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of skills) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    }
    return { minX: minX - 100, maxX: maxX + 100, minY: minY - 100, maxY: maxY + 100 };
  }, [skills]);
  const treeWidth = treeBounds.maxX - treeBounds.minX;
  const treeHeight = treeBounds.maxY - treeBounds.minY;

  // Zoom button handler — zooms from the viewport center
  const handleZoom = useCallback((delta: number) => {
    const newScale = Math.min(Math.max(0.3, scale + delta), 2);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const worldX = (cx - position.x) / scale;
      const worldY = (cy - position.y) / scale;
      setPosition({ x: cx - worldX * newScale, y: cy - worldY * newScale });
    }
    setScale(newScale);
  }, [scale, position]);

  // Wheel zoom (desktop)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(0.3, scale + delta), 2);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - position.x) / scale;
      const worldY = (mouseY - position.y) / scale;
      setPosition({ x: mouseX - worldX * newScale, y: mouseY - worldY * newScale });
    }
    setScale(newScale);
  }, [scale, position]);

  // Mouse pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => { setIsDragging(false); }, []);

  // Touch helpers
  const getTouchInfo = useCallback((touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = (touches[0].clientX + touches[1].clientX) / 2;
    const midY = (touches[0].clientY + touches[1].clientY) / 2;
    return { distance, midX, midY };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger pinch zoom
      e.preventDefault(); // Prevent browser zoom
      const { distance, midX, midY } = getTouchInfo(e.touches);
      const rect = containerRef.current?.getBoundingClientRect();
      
      // Calculate screen position of midpoint
      const screenMidX = midX - (rect?.left ?? 0);
      const screenMidY = midY - (rect?.top ?? 0);
      
      // Calculate and LOCK the world position at touch start
      const currentPos = positionRef.current;
      const currentScale = scaleRef.current;
      const worldOriginX = (screenMidX - currentPos.x) / currentScale;
      const worldOriginY = (screenMidY - currentPos.y) / currentScale;
      
      pinchRef.current = {
        distance,
        scale: currentScale,
        originX: worldOriginX,  // Lock this world position
        originY: worldOriginY,
      };
      
      touchStartRef.current = null;
      hasMoved.current = false;
    } else if (e.touches.length === 1) {
      // Single finger pan
      pinchRef.current = null;
      hasMoved.current = false;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
      setDragStart({
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      });
    }
  }, [getTouchInfo]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasMoved.current = true;

      const { distance: newDistance, midX: rawMidX, midY: rawMidY } = getTouchInfo(e.touches);
      const rect = containerRef.current?.getBoundingClientRect();
      const screenMidX = rawMidX - (rect?.left ?? 0);
      const screenMidY = rawMidY - (rect?.top ?? 0);

      let ratio = newDistance / pinchRef.current.distance;
      const dampening = 0.5;
      ratio = 1 + (ratio - 1) * dampening;

      let newScale = pinchRef.current.scale * ratio;
      newScale = Math.min(Math.max(0.3, newScale), 2);

      const lockedWorldX = pinchRef.current.originX;
      const lockedWorldY = pinchRef.current.originY;
      const newX = screenMidX - lockedWorldX * newScale;
      const newY = screenMidY - lockedWorldY * newScale;

      // ✅ Direct DOM update — no React re-render during pinch
      applyTransformDirect(newX, newY, newScale);

    } else if (e.touches.length === 1 && touchStartRef.current) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

      if (deltaX > 10 || deltaY > 10) {
        e.preventDefault();
        hasMoved.current = true;

        if (!isDragging) setIsDragging(true);

        const newX = e.touches[0].clientX - dragStart.x;
        const newY = e.touches[0].clientY - dragStart.y;

        // ✅ Direct DOM update — no React re-render during pan
        applyTransformDirect(newX, newY, liveTransform.current.scale);
      }
    }
  }, [isDragging, dragStart, getTouchInfo, applyTransformDirect]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
      touchStartRef.current = null;

      // ✅ Commit the live DOM transform to React state only once, on finger lift
      const { x, y, scale: s } = liveTransform.current;
      setScale(s);
      setPosition({ x, y });

      hasMoved.current = false;
    }
  }, []);

  const resetView = useCallback(() => {
    setScale(isMobile ? 0.5 : 0.8);
    setPosition({ x: isMobile ? 50 : -200, y: isMobile ? 50 : -100 });
  }, [isMobile]);

  const handleSkillClick = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
    if (startHereRef.current) {
      startHereRef.current = false;
      setShowStartHere(false);
      localStorage.setItem('straps_has_clicked_skill', '1');
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSkill(null);
  }, []);

  const handleToggleComplete = useCallback(() => {
    if (selectedSkill) toggleSkillCompletion(selectedSkill.id);
  }, [selectedSkill, toggleSkillCompletion]);

  const handleToggleFavorite = useCallback(() => {
    if (selectedSkill) toggleSkillFavorite(selectedSkill.id);
  }, [selectedSkill, toggleSkillFavorite]);

  return (
    <div className="relative w-full h-full overflow-hidden tree-canvas overscroll-none">

      {/* Floating bottom toolbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <div
          className="flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] border"
          style={{ background: '#1a1d23', borderColor: '#2b303b' }}
        >
          {/* Zoom controls */}
          <div className="flex items-center gap-[12px] px-[12px] h-[40px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(-0.2)}
              className="h-8 w-8 text-white hover:text-white hover:bg-white/10 rounded-md"
            >
              <Minus size={18} />
            </Button>

            <span className="text-white text-[14px] leading-[20px] tabular-nums w-10 text-center select-none">
              {Math.round(scale * 100)}%
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(0.2)}
              className="h-8 w-8 text-white hover:text-white hover:bg-white/10 rounded-md"
            >
              <Plus size={18} />
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-[33px] shrink-0" style={{ background: '#2b303b' }} />

          {/* Icon buttons group */}
          <div className="flex items-center gap-[12px] px-[12px] h-[40px]">

            {/* Legend */}
            <div className="relative">
              {showLegend && (
                <div
                  className="absolute bottom-full mb-5 left-1/2 -translate-x-1/2 rounded-xl p-4 w-44 z-30"
                  style={{ background: '#1a1d23', border: '1px solid #2b303b' }}
                >
                  <h3 className="text-sm font-medium text-white mb-3">Legend</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-white font-medium">Categories</p>
                    <div className="flex items-center gap-2">
                      <img src="/shapes/category-blue.svg" alt="" className="w-5 h-5" />
                      <span className="text-white/60">Two arm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src="/shapes/category-ornate.svg" alt="" className="w-5 h-5" />
                      <span className="text-white/60">One arm</span>
                    </div>
                    <p className="text-white font-medium pt-1">Skills</p>
                    <div className="flex items-center gap-2">
                      <img src="/shapes/regular-blue-new.svg" alt="" className="w-5 h-5" />
                      <span className="text-white/60">Two arm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src="/shapes/regular-purple.svg" alt="" className="w-5 h-5" />
                      <span className="text-white/60">One arm</span>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowLegend(v => !v)}
                className="flex flex-col items-center justify-center gap-[2px] w-[40px] h-full text-white/70 hover:text-white transition-colors overflow-hidden"
              >
                <Map size={20} />
                <span className="text-[8.8px] leading-[13.2px] tracking-[0.352px]">Legend</span>
              </button>
            </div>

            {/* Bugs */}
            <button
              onClick={() => onOpenFeedback?.()}
              className="flex flex-col items-center justify-center gap-[2px] w-[40px] h-full text-white/70 hover:text-white transition-colors overflow-hidden"
            >
              <MessageCircle size={20} />
              <span className="text-[8.8px] leading-[13.2px] tracking-[0.352px]">Bugs</span>
            </button>

            {/* Help */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex flex-col items-center justify-center gap-[2px] w-[40px] h-full text-white/70 hover:text-white transition-colors overflow-hidden"
            >
              <CircleHelp size={20} />
              <span className="text-[8.8px] leading-[13.2px] tracking-[0.352px]">Help</span>
            </button>

          </div>
        </div>
      </div>

      {/* Tree container */}
      <div
        ref={containerRef}
        className={'w-full h-full cursor-grab active:cursor-grabbing'}
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStartCapture={handleTouchStart}
        onTouchMoveCapture={handleTouchMove}
        onTouchEndCapture={handleTouchEnd}
      >
        <div
          ref={transformDivRef}
          className="relative"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: treeWidth,
            height: treeHeight,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            willChange: isDragging ? 'transform' : 'auto',
          }}
        >
          {/* Dot pattern layer — part of the transformed content, so it pans
              and zooms via the same GPU-composited transform as everything
              else instead of a per-frame background-position/-size repaint. */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: treeBounds.minX,
              top: treeBounds.minY,
              width: treeWidth,
              height: treeHeight,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)',
              backgroundSize: `${DOT_BASE}px ${DOT_BASE}px`,
            }}
          />

          <ConnectionLines skills={skills} completedSkills={completedSkills} treeBounds={treeBounds} />

          {!treeReady && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'hsl(220 15% 8%)',
                zIndex: 50,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '2px solid hsl(270 70% 60%)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ fontSize: 12, color: 'hsl(220 10% 55%)' }}>Loading skill tree...</p>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {treeReady && showStartHere && (
            <div
              style={{
                position: 'absolute',
                left: 1050,
                top: 502,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
                animation: 'startHereBounce 1.2s ease-in-out infinite',
                zIndex: 10,
              }}
            >
              {/* triangle pointer toward node — sits behind pill, overlaps by 4px */}
              <div style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '10px solid hsl(45 100% 65%)',
                marginBottom: -4,
                zIndex: 0,
              }} />
              {/* pill */}
              <div style={{
                background: 'hsl(45 100% 65%)',
                color: 'hsl(220 15% 8%)',
                padding: '4px 12px',
                borderRadius: 6,
                zIndex: 1,
                position: 'relative',
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}>Start Here</div>
              <style>{`
                @keyframes startHereBounce {
                  0%, 100% { transform: translateX(-50%) translateY(0); }
                  50% { transform: translateX(-50%) translateY(4px); }
                }
              `}</style>
            </div>
          )}

          {treeReady && visibleSkills.map(skill => (
            <DraggableSkillNode
              key={skill.id}
              skill={skill}
              isCompleted={isSkillCompleted(skill.id)}
              isFavorite={isSkillFavorite(skill.id)}
              isAvailable={availableSkills.has(skill.id)}
              onClick={() => handleSkillClick(skill)}
            />
          ))}
        </div>
      </div>

      {/* Skill Modal — stays mounted so Radix Dialog animations work correctly */}
      <Suspense fallback={null}>
        <SkillModal
          skill={selectedSkill}
          isOpen={isModalOpen}
          onClose={closeModal}
          isCompleted={selectedSkill ? isSkillCompleted(selectedSkill.id) : false}
          isFavorite={selectedSkill ? isSkillFavorite(selectedSkill.id) : false}
          onToggleComplete={handleToggleComplete}
          onToggleFavorite={handleToggleFavorite}
          allSkills={skills}
          completedSkills={completedSkills}
        />
      </Suspense>

      {/* Onboarding Modal — delayed mount so it doesn't affect LCP */}
      {onboardingMounted && (
        <Suspense fallback={null}>
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onComplete={handleOnboardingComplete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SkillTree;