import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Menu from '@/components/Menu';

const defaultProps = {
  onClose: vi.fn(),
  onReset: vi.fn(),
  onOpenFeedback: vi.fn(),
  completedCount: 5,
  totalSkills: 111,
  level: 'Level 1: Rookie',
  progressPct: 4.5,
  skills: [],
  favoriteSkills: new Set<string>(),
  onNavigateToSkill: vi.fn(),
};

describe('Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the level label', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Level 1: Rookie')).toBeInTheDocument();
  });

  it('renders progress count', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('/111')).toBeInTheDocument();
  });

  it('renders the description subtitle', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText(/Your complete guide to aerial straps/)).toBeInTheDocument();
  });

  it('calls onClose when back arrow clicked', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getAllByLabelText('Close menu')[0]);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button clicked', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getAllByLabelText('Close menu')[1]);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Dismiss button clicked', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Dismiss'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('Give feedback button calls onClose and onOpenFeedback', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Give feedback'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onOpenFeedback).toHaveBeenCalledTimes(1);
  });

  it('shows reset confirmation when Reset is clicked', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByText('Reset all progress?')).toBeInTheDocument();
    expect(screen.getByText(/Be careful/)).toBeInTheDocument();
    expect(screen.getByText('Yes, reset')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides confirmation and shows Reset again when Cancel is clicked', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Reset'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Reset all progress?')).not.toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('calls onReset and onClose when "Yes, reset" confirmed', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Reset'));
    fireEvent.click(screen.getByText('Yes, reset'));
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onReset if user cancels', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Reset'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onReset).not.toHaveBeenCalled();
  });

  it('renders Profile section with coming-soon items', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders Volunteer section', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Volunteer')).toBeInTheDocument();
    expect(screen.getByText('Give feedback')).toBeInTheDocument();
    expect(screen.getByText('Volunteer to help')).toBeInTheDocument();
  });

  it('renders Credits section', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Credits to')).toBeInTheDocument();
    expect(screen.getByText(/Alvaro Medrano/)).toBeInTheDocument();
  });
});
