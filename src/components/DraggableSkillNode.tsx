import React, { useCallback, useRef } from 'react';
import { Skill } from '@/data/skillTreeData';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSkillNodeProps {
  skill: Skill;
  isCompleted: boolean;
  isFavorite: boolean;
  isAvailable: boolean;
  onClick: () => void;
}

const SVG_PATHS = {
  category: {
    purple: '/shapes/category-ornate.svg',
    blue: '/shapes/category-blue.svg',
  },
  key: {
    blue: '/shapes/key-blue-new.svg',
    purple: '/shapes/key-purple.svg',
  },
  regular: {
    blue: '/shapes/regular-blue-new.svg',
    purple: '/shapes/regular-purple.svg',
  },
  inactive: '/shapes/regular-inactive.svg',
};

const DraggableSkillNode: React.FC<DraggableSkillNodeProps> = ({
  skill,
  isCompleted,
  isFavorite,
  isAvailable,
  onClick,
}) => {
  const isCategory = skill.type === 'category';
  const isKey = skill.type === 'key';
  const isActive = isCompleted;
  const hasGoldBorder = skill.isGoldBorder || isKey;

  const getSize = () => {
    if (isCategory) return { width: 101, height: 101 };
    return { width: 80, height: 80 };
  };

  const { width, height } = getSize();

  const getSvgPath = () => {
    const useBlue = skill.isBlue || skill.x > 1020;

    if (isCategory) {
      return useBlue ? SVG_PATHS.category.blue : SVG_PATHS.category.purple;
    }

    if (isKey) {
      if (!isCompleted) return SVG_PATHS.inactive;
      return useBlue ? SVG_PATHS.key.blue : SVG_PATHS.key.purple;
    }

    return useBlue ? SVG_PATHS.regular.blue : SVG_PATHS.regular.purple;
  };

  const getGlowClass = () => {
    if (isKey || hasGoldBorder) return 'skill-node-svg-glow-gold';
    return '';
  };

  const getTextSize = () => {
    if (isCategory) return 'text-sm leading-[14px]';
    if (isKey) return 'text-[11px] leading-[11px]';
    return 'text-[10px] leading-[10px]';
  };

  // Touch tap detection — distinguish tap from pan gesture
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    e.stopPropagation();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  }, [onClick]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  }, [onClick]);

  // Covers what a sighted user reads from color/grayscale/glow — name,
  // category vs key vs regular skill, and locked/available/completed state.
  const stateLabel = isCategory ? 'category' : isCompleted ? 'completed' : isAvailable ? 'available' : 'locked';
  const ariaLabel = [
    skill.name,
    !isCategory && isKey ? 'key skill' : null,
    stateLabel,
    isFavorite ? 'favorited' : null,
  ].filter(Boolean).join(', ');

  return (
    <div
      className={cn(
        "skill-node absolute flex items-center justify-center transition-all duration-300",
        "hover:scale-110 cursor-pointer"
      )}
      style={{
        left: skill.x - width / 2,
        top: skill.y - height / 2,
        width,
        height,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        pointerEvents: 'auto',
        zIndex: isAvailable ? 25 : 20,
        touchAction: 'none',
      }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* SVG Shape */}
      <img
        src={getSvgPath()}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(
          'absolute inset-0 w-full h-full object-contain',
          'transition-[filter,opacity] duration-300',
          !isActive && !isKey && 'skill-node-grayscale opacity-70',
          (isActive || isKey) && getGlowClass()
        )}
        draggable={false}
      />

      {/* Gold glow overlay for key / gold border skills */}
      {hasGoldBorder && (
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            isActive && "animate-glow-pulse"
          )}
          style={{
            background: isActive
              ? 'radial-gradient(circle, hsl(45 90% 55% / 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(45 90% 55% / 0.15) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Text Overlay */}
      <div
        className="relative z-10 flex items-center justify-center text-center px-2"
        style={{
          maxWidth: width - 16,
          paddingTop: isCategory ? '8px' : '4px',
        }}
      >
        <span
          className={cn(
            'skill-text font-display font-normal leading-tight text-white',
            getTextSize()
          )}
          style={{
            textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          {skill.name}
        </span>
      </div>

      {/* Favorite star indicator */}
      {isFavorite && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-skill-gold rounded-full flex items-center justify-center z-20 shadow-lg">
          <Star size={12} className="text-background fill-background" />
        </div>
      )}
    </div>
  );
};

export default DraggableSkillNode;
