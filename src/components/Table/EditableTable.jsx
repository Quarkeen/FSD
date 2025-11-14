import React, { useState, useEffect } from 'react';
import EditableCell from './EditableCell';

function EditableTable({ data, summary, hiddenColumns = [], onDataChange }) {
  const [tableData, setTableData] = useState(data);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const updateCellData = (rowIndex, columnId, value) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      const row = { ...newData[rowIndex] };
      
      // Type conversion based on data type
      const dataType = summary.dataTypes[columnId];
      if (dataType === 'number') {
        row[columnId] = value === '' ? null : parseFloat(value);
      } else if (dataType === 'boolean') {
        row[columnId] = value === 'true';
      } else {
        row[columnId] = value;
      }
      
      newData[rowIndex] = row;
      
      // Notify parent component of changes
      if (onDataChange) {
        onDataChange(newData);
      }
      
      return newData;
    });
  };

  const visibleHeaders = summary.headers.filter(
    (header) => !hiddenColumns.includes(header)
  );

  return (
    <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-indigo-500">
              #
            </th>
            {visibleHeaders.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-indigo-500"
              >
                <div className="flex items-center justify-between">
                  <span>{header}</span>
                  <span className="text-indigo-200 text-xs ml-2">
                    ({summary.dataTypes[header]})
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-500 border-r border-gray-200">
                {rowIndex + 1}
              </td>
              {visibleHeaders.map((header) => (
                <td
                  key={`${rowIndex}-${header}`}
                  className="whitespace-nowrap text-sm text-gray-900 border-r border-gray-200"
                >
                  <EditableCell
                    value={row[header]}
                    rowIndex={rowIndex}
                    columnId={header}
                    dataType={summary.dataTypes[header]}
                    updateData={updateCellData}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Double-click any cell to edit. Press Enter to save or Escape to cancel.
        </p>
      </div>
    </div>
  );
}

export default EditableTable;
