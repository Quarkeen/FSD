import React, { useState, useEffect, useRef } from 'react';

function EditableCell({ value, rowIndex, columnId, updateData, dataType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [cellValue, setCellValue] = useState(value);
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

  const handleDoubleClick = () => {
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
    const newValue = e.target.value;
    setCellValue(newValue);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={dataType === 'number' ? 'number' : 'text'}
        value={cellValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="px-2 py-1 cursor-pointer hover:bg-blue-50 hover:border hover:border-blue-300 rounded transition-colors duration-150 min-h-[32px] flex items-center group"
      title="Double-click to edit"
    >
      <span className="flex-1">{cellValue || '—'}</span>
      <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 text-xs">
        ✎
      </span>
    </div>
  );
}

export default EditableCell;
