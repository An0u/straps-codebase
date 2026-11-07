import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Skill } from '@/data/skillTreeData';

interface SkillSearchProps {
  skills: Skill[];
  onSelect: (skill: Skill) => void;
  onClose: () => void;
}

const SkillSearch: React.FC<SkillSearchProps> = ({ skills, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return skills
      .filter(s => s.type !== 'category' && s.name?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, skills]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[activeIndex]) {
      onSelect(results[activeIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-[420px] rounded-[10px] overflow-hidden flex flex-col"
        style={{ background: '#2b303b', boxShadow: '0px 8px 24px 0px rgba(0,0,0,0.14)' }}
      >
        <div className="flex items-center gap-2 px-4 h-12 shrink-0" style={{ borderBottom: '1px solid #1a1d23' }}>
          <Search size={18} className="text-white/60 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search skills..."
            aria-label="Search skills"
            className="flex-1 bg-transparent text-white text-[14px] placeholder:text-white/40 focus:outline-none"
          />
          <button onClick={onClose} aria-label="Close search" className="text-white/60 hover:text-white shrink-0">
            <X size={18} />
          </button>
        </div>

        {query.trim() && (
          <div className="max-h-[320px] overflow-y-auto py-1" role="listbox">
            {results.length === 0 ? (
              <p className="text-[13px] text-white/50 px-4 py-3">No skills found.</p>
            ) : (
              results.map((skill, i) => (
                <button
                  key={skill.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => onSelect(skill)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className="w-full text-left px-4 h-10 flex items-center text-[14px] text-white"
                  style={{ background: i === activeIndex ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  {skill.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSearch;
