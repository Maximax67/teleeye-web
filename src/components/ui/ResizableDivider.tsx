import { useState, useCallback, useEffect } from 'react';

interface ResizableDividerProps {
  onResize: (width: number) => void;
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
}

export function ResizableDivider({
  onResize,
  initialWidth,
  minWidth,
  maxWidth,
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    onResize(initialWidth);
  }, [initialWidth, onResize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      onResize(newWidth);
    },
    [isDragging, minWidth, maxWidth, onResize],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`w-1 cursor-col-resize transition-colors hover:bg-blue-500 ${
        isDragging ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    />
  );
}
