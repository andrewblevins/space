import React, { useState } from "react";

/**
 * Textarea that can be resized vertically by dragging the handle.
 * @param {object} props
 * @param {string} props.value
 * @param {(e: React.ChangeEvent<HTMLTextAreaElement>) => void} props.onChange
 * @param {(e: React.KeyboardEvent<HTMLTextAreaElement>) => void} props.onSubmit
 * @param {boolean} props.isLoading
 */
export function ExpandingInput({ value, onChange, onSubmit, isLoading }) {
  const [height, setHeight] = useState('60px');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="flex-1">
      {!isMobile && (
        <div
          className="w-full h-1 cursor-ns-resize bg-green-400/10 hover:bg-green-400/20 transition-colors"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startHeight = parseInt(height);

          const handleMouseMove = (moveEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const newHeight = Math.min(300, Math.max(60, startHeight + deltaY));
            setHeight(`${newHeight}px`);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        />
      )}
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        style={{ height: isMobile ? '80px' : height }}
        className={`
          w-full
          min-h-[80px]
          max-h-[300px]
          bg-black
          text-green-400
          font-serif
          ${isMobile ? 'p-4 text-base' : 'p-2 md:p-4 text-sm md:text-base'}
          border
          border-green-400
          focus:outline-none
          rounded-md
          resize-none
          leading-relaxed
          ${isLoading ? 'opacity-50' : ''}
        `}
        placeholder={isLoading ? 'Waiting for response...' : 'Type your message...'}
        disabled={isLoading}
      />
    </div>
  );
}

export default ExpandingInput;
