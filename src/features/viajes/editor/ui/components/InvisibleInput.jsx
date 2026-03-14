import React, { useState, useRef } from 'react';
import { COLORS, FONTS, TRANSITIONS } from '@shared/config';

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

  const containerStyle = {
    display: 'block',
    position: 'relative',
    cursor: isEditing ? 'text' : 'pointer',
    userSelect: isEditing ? 'text' : 'none',
    minHeight: multiline ? '60px' : 'auto',
    transition: TRANSITIONS.fast,
  };

  const baseInputStyle = {
    width: '100%',
    border: 'none',
    outline: 'none',
    padding: 0,
    margin: 0,
    fontFamily: FONTS.text,
    backgroundColor: 'transparent',
    color: COLORS.charcoalBlue,
    transition: TRANSITIONS.fast,
    resize: multiline ? 'vertical' : 'none',
  };

  const displayStyle = {
    ...baseInputStyle,
    display: isEditing ? 'none' : 'block',
    whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
    wordBreak: multiline ? 'break-word' : 'normal',
    opacity: value ? 1 : 0.5,
    ...textStyle,
  };

  const inputStyle = {
    ...baseInputStyle,
    display: isEditing ? 'block' : 'none',
    padding: '2px 4px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    border: `1px solid ${COLORS.atomicTangerine}`,
    boxShadow: `0 0 0 2px rgba(255, 107, 53, 0.15)`,
    ...textStyle,
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Display text */}
      <span
        style={displayStyle}
        onClick={handleClick}
        title={isEditing ? '' : 'Click to edit'}
      >
        {displayValue}
      </span>

      {/* Editable input */}
      {multiline ? (
        <textarea
          ref={inputRef}
          style={inputStyle}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          style={inputStyle}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      )}
    </div>
  );
};

export default InvisibleInput;
