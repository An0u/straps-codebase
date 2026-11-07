import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { skillTreeData } from '@/data/skillTreeData';

// No sheet data — use local skillTreeData, matching useSheetSkills' real
// placeholderData behavior (it never actually resolves to null/undefined)
vi.mock('@/hooks/useSheetSkills', () => ({
  useSheetSkills: () => ({ data: skillTreeData }),
}));

// ResizeObserver not in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

import SkillTree from '@/components/SkillTree';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('SkillTree legend', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('legend popup is hidden by default', () => {
    render(<SkillTree />, { wrapper });
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
  });

  it('clicking Legend toggles the popup open with category and skill-type rows', () => {
    render(<SkillTree />, { wrapper });
    fireEvent.click(screen.getByText('Legend'));

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getAllByText('Two arm')).toHaveLength(2);
    expect(screen.getAllByText('One arm')).toHaveLength(2);
  });
});
