import React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  horizontal?: boolean;
  showScrollbar?: boolean;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className = '',
  horizontal = true,
  showScrollbar = false,
}) => {
  return (
    <div
      className={`
        relative overflow-hidden
        ${horizontal ? 'h-full' : 'w-full'}
        ${className}
      `}
    >
      <div
        className={`
          ${horizontal ? 'flex space-x-4' : 'space-y-4'}
          ${horizontal ? 'overflow-x-auto' : 'overflow-y-auto'}
          ${showScrollbar ? '' : 'scrollbar-hide'}
          p-4
        `}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: showScrollbar ? 'auto' : 'none',
          msOverflowStyle: showScrollbar ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
