import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  className
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative transition-all duration-300 hover:scale-105',
        showLabel && 'justify-start space-x-2',
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun 
          className={cn(
            'absolute w-5 h-5 transition-all duration-300',
            theme === 'dark' 
              ? 'scale-0 rotate-90 opacity-0' 
              : 'scale-100 rotate-0 opacity-100'
          )}
        />
        <Moon 
          className={cn(
            'absolute w-5 h-5 transition-all duration-300',
            theme === 'light' 
              ? 'scale-0 -rotate-90 opacity-0' 
              : 'scale-100 rotate-0 opacity-100'
          )}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </span>
      )}
    </Button>
  );
};