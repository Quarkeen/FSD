import React, { useState, useEffect, useRef } from 'react';

function EditableCellWithIcon({ value, rowIndex, columnId, updateData, dataType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [cellValue, setCellValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setCellValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (cellValue !== value) {
      updateData(rowIndex, columnId, cellValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      updateData(rowIndex, columnId, cellValue);
    } else if (e.key === 'Escape') {
      setCellValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    setCellValue(e.target.value);
  };

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type={dataType === 'number' ? 'number' : 'text'}
          value={cellValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none bg-white"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
          ↵
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`px-2 py-1 cursor-pointer rounded transition-all duration-200 min-h-[32px] flex items-center justify-between ${
        isHovered ? 'bg-blue-50 border border-blue-300 shadow-sm' : 'border border-transparent'
      }`}
    >
      <span className="flex-1 truncate">{cellValue !== null && cellValue !== undefined ? cellValue : '—'}</span>
      {isHovered && (
        <svg
          className="w-4 h-4 text-blue-500 ml-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      )}
    </div>
  );
}

export default EditableCellWithIcon;
