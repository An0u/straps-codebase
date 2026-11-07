import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock lazy-loaded SkillTree so Suspense resolves immediately
vi.mock('@/components/SkillTree', () => ({
  default: () => <div data-testid="skill-tree" />,
}));

// Mock FeedbackModal
vi.mock('@/components/FeedbackModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="feedback-modal" /> : null,
}));

// No sheet data — use local skillTreeData
vi.mock('@/hooks/useSheetSkills', () => ({
  useSheetSkills: () => ({ data: null }),
}));

// ResizeObserver not in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

import Index from '@/pages/Index';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('Index page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders "The Strapstree" title', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => {
      expect(screen.getAllByText(/The Strapstree/i).length).toBeGreaterThan(0);
    });
  });

  it('shows Level 1: Rookie with no progress', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => {
      expect(screen.getAllByText('Level 1: Rookie').length).toBeGreaterThan(0);
    });
  });

  it('shows 0 completed skills on first load', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  it('does NOT render the floating round FeedbackButton', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByLabelText('Send Feedback')).not.toBeInTheDocument();
    });
  });

  it('renders hamburger menu buttons (desktop + mobile)', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => {
      // jsdom renders both desktop and mobile bars — both have Open menu
      expect(screen.getAllByLabelText('Open menu').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens the menu when hamburger is clicked', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => screen.getAllByLabelText('Open menu'));
    fireEvent.click(screen.getAllByLabelText('Open menu')[0]);
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('closes the menu when backdrop is clicked', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => screen.getAllByLabelText('Open menu'));
    fireEvent.click(screen.getAllByLabelText('Open menu')[0]);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    const backdrop = document.querySelector('.bg-black\\/50') as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it('closes the menu when X is clicked', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => screen.getAllByLabelText('Open menu'));
    fireEvent.click(screen.getAllByLabelText('Open menu')[0]);
    fireEvent.click(screen.getAllByLabelText('Close menu')[0]);
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it('shows Reset buttons in the top bar', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => {
      expect(screen.getAllByText('Reset').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('top bar Reset shows confirmation on first click', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => screen.getAllByText('Reset'));
    fireEvent.click(screen.getAllByText('Reset')[0]);
    expect(screen.getByText('Confirm reset')).toBeInTheDocument();
  });

  it('top bar Cancel hides confirmation', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => screen.getAllByText('Reset'));
    fireEvent.click(screen.getAllByText('Reset')[0]);
    fireEvent.click(screen.getAllByText('Cancel')[0]);
    expect(screen.queryByText('Confirm reset')).not.toBeInTheDocument();
  });

  it('top bar reset actually clears progress', async () => {
    localStorage.setItem(
      'skill-tree-progress',
      JSON.stringify({ completedSkills: ['planche'], lastUpdated: new Date().toISOString() })
    );
    render(<Index />, { wrapper });
    await waitFor(() => screen.getAllByText('Reset'));
    fireEvent.click(screen.getAllByText('Reset')[0]);
    fireEvent.click(screen.getAllByText('Confirm reset')[0]);
    expect(localStorage.getItem('skill-tree-progress')).toBeNull();
  });

  it('menu give feedback opens the feedback modal', async () => {
    render(<Index />, { wrapper });
    await waitFor(() => screen.getAllByLabelText('Open menu'));
    fireEvent.click(screen.getAllByLabelText('Open menu')[0]);
    fireEvent.click(screen.getByText('Give feedback'));
    await waitFor(() => {
      expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
    });
  });
});
