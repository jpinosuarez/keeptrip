import React, { useState, useRef } from 'react';
import { cn } from '@shared/lib/utils/cn';

/**
 * InvisibleInput: Click-to-edit typography.
 * Displays as plain text initially; becomes editable on click.
 * Perfect for Trip Title, Notes, or Highlights.
 */
const InvisibleInput = ({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Click to edit...',
  multiline = false,
  maxLength,
  textStyle = {},
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const handleClick = () => {
    setIsEditing(true);
    // Focus on next render
    setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current && !multiline) {
        inputRef.current.select();
      }
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onBlur?.();
  };

  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  const displayValue = value || placeholder;

  return (
    <div 
      className={cn(
        "block relative transition-all",
        isEditing ? "cursor-text select-text" : "cursor-pointer select-none",
        multiline ? "min-h-[60px]" : "h-auto",
        className
      )}
    >
      {/* Display text */}
      <span
        onClick={handleClick}
        title={isEditing ? '' : 'Click to edit'}
        className={cn(
          "w-full border-none outline-none p-0 m-0 bg-transparent text-charcoalBlue transition-all",
          isEditing ? "hidden" : "block",
          multiline ? "whitespace-pre-wrap break-words" : "whitespace-nowrap",
          !value && "opacity-50"
        )}
        style={textStyle}
      >
        {displayValue}
      </span>

      {/* Editable input */}
      {multiline ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full border-none outline-none m-0 text-charcoalBlue transition-all resize-y p-1 rounded bg-atomicTangerine/10 border border-atomicTangerine ring-2 ring-atomicTangerine/15",
            isEditing ? "block" : "hidden"
          )}
          style={textStyle}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full border-none outline-none m-0 text-charcoalBlue transition-all resize-none p-1 rounded bg-atomicTangerine/10 border border-atomicTangerine ring-2 ring-atomicTangerine/15",
            isEditing ? "block" : "hidden"
          )}
          style={textStyle}
        />
      )}
    </div>
  );
};

export default InvisibleInput;
