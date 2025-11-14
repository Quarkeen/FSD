// This file runs in a separate thread (a Web Worker)
import Papa from 'papaparse';

console.log('Worker script loaded with PapaParse.');

// --- Worker State ---
let FULL_DATASET = [];
let VIEW_DATASET = []; // Holds the filtered and sorted data
let SECONDARY_DATASET = []; // Holds data from the second file for merging
let DATA_SUMMARY = {}; // Holds headers, data types, etc.
let currentSort = { key: null, direction: 'asc' };
let currentFilter = { keyword: '' };
let hiddenColumns = new Set(); // Track hidden columns
let columnRenames = {}; // Track column renames: { oldName: newName }
let conditionalFormats = []; // Track conditional formatting rules
let ROW_ID_COUNTER = 0; // For unique row tracking

// --- Helper Functions for Row ID Management ---

/**
 * Adds a unique _rowId to each row for reliable tracking
 */
function addRowIds(data) {
  return data.map((row) => ({
    _rowId: ROW_ID_COUNTER++,
    ...row
  }));
}

/**
 * Removes the _rowId from rows (for export/display)
 */
function removeRowIds(data) {
  return data.map(row => {
    const { _rowId, ...rest } = row;
    return rest;
  });
}

// --- Worker Event Listener ---
self.onmessage = (event) => {
  const { type, payload } = event.data;
  console.log('Message received in worker:', type);

  try {
    const startTime = performance.now();
    let result; // Will hold { preview, formattingMap }
    let resultPreview; // For simple cases

    switch (type) {
      case 'PARSE_FILE':
        Papa.parse(payload.file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            // Add unique IDs to each row
            FULL_DATASET = addRowIds(results.data);
            VIEW_DATASET = FULL_DATASET.slice();
            
            // Analyze data without the _rowId column
            DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
            
            // Reset state
            hiddenColumns.clear();
            hiddenColumns.add('_rowId'); // Hide the ID column from users
            columnRenames = {};
            conditionalFormats = [];
            SECONDARY_DATASET = [];

            const endTime = performance.now();
            console.log(`Parsing took ${(endTime - startTime).toFixed(2)}ms`);

            result = updateViewDataset();
            self.postMessage({
              type: 'SUCCESS_ANALYSIS',
              payload: {
                summary: DATA_SUMMARY,
                previewData: result.preview,
                formattingMap: result.formattingMap,
                hiddenColumns: Array.from(hiddenColumns).filter(col => col !== '_rowId'),
              },
            });
          },
          error: (err) => {
            throw new Error(err.message);
          },
        });
        return;

      case 'SORT_DATA':
        currentSort = {
          key: payload?.key ?? currentSort.key,
          direction: payload?.direction ?? currentSort.direction,
        };
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: { 
            previewData: result.preview, 
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length 
          },
        });
        break;

      case 'FILTER_DATA':
        currentFilter = { keyword: String(payload?.keyword ?? '').trim() };
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: { 
            previewData: result.preview, 
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length 
          },
        });
        break;

      case 'TOGGLE_COLUMN':
        const column = payload.column;
        if (hiddenColumns.has(column)) {
          hiddenColumns.delete(column);
        } else {
          hiddenColumns.add(column);
        }
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            hiddenColumns: Array.from(hiddenColumns).filter(col => col !== '_rowId'),
          },
        });
        break;

      case 'RENAME_COLUMN':
        const { oldName, newName } = payload;
        renameColumn(oldName, newName);
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
          },
        });
        break;

      case 'REMOVE_DUPLICATES':
        const { columns } = payload;
        removeDuplicates(columns);
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
            message: `Removed duplicates. New row count: ${FULL_DATASET.length}`,
          },
        });
        break;

      case 'HANDLE_MISSING':
        const { strategy, columns: targetColumns, fillValue } = payload;
        handleMissingData(strategy, targetColumns, fillValue);
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
            message: `Applied ${strategy} strategy. New row count: ${FULL_DATASET.length}`,
          },
        });
        break;

      case 'COMPUTE_AGGREGATIONS':
        const aggregations = computeAggregations(payload.columns);
        self.postMessage({
          type: 'SUCCESS_AGGREGATIONS',
          payload: { aggregations },
        });
        break;

      case 'DOWNLOAD_FILE':
        const csvString = Papa.unparse(removeRowIds(applyColumnVisibility(VIEW_DATASET)));
        const downloadEndTime = performance.now();
        console.log(`Unparsing for download took ${(downloadEndTime - startTime).toFixed(2)}ms`);
        self.postMessage({
          type: 'SUCCESS_DOWNLOAD',
          payload: { 
            csvString: csvString,
            customFileName: payload.customFileName,
            destinationPath: payload.destinationPath,
          },
        });
        break;

      case 'ADD_ROW':
        addRow(payload.rowData);
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
            message: `Row added successfully. Total rows: ${FULL_DATASET.length}`,
          },
        });
        break;

      case 'ADD_COLUMN':
        addColumn(payload.columnName, payload.defaultValue);
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
            message: `Column "${payload.columnName}" added successfully.`,
          },
        });
        break;
        
      // --- NEW FEATURES START HERE ---

      case 'ADD_FORMULA_COLUMN':
        addFormulaColumn(payload.newColumnName, payload.formulaString);
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
            message: `Formula column "${payload.newColumnName}" added.`,
          },
        });
        break;

      case 'ADD_CONDITIONAL_FORMAT':
        conditionalFormats.push(payload.rule); // rule = { column, operator, value, styleClass }
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            message: `Formatting rule added.`,
          },
        });
        break;
        
      case 'CLEAR_CONDITIONAL_FORMATS':
        conditionalFormats = [];
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            message: `All formatting rules cleared.`,
          },
        });
        break;

      case 'GROUP_AND_AGGREGATE':
        const groupedData = groupAndAggregate(payload.groupKey, payload.aggregations);
        self.postMessage({
          type: 'SUCCESS_GROUPING',
          payload: { 
            groupedData: groupedData,
            message: `Data grouped by "${payload.groupKey}".`
          },
        });
        break;
        
      case 'GENERATE_PIVOT_TABLE':
        const pivotData = generatePivotTable(
          payload.rowKey, 
          payload.colKey, 
          payload.aggCol, 
          payload.aggFn
        );
        self.postMessage({
          type: 'SUCCESS_PIVOT',
          payload: { 
            pivotData: pivotData,
            message: `Pivot table generated.`
          },
        });
        break;

      case 'GET_CHART_DATA':
        const chartData = getChartData(
          payload.labelColumn, 
          payload.dataColumns, 
          payload.chartType
        );
        self.postMessage({
          type: 'SUCCESS_CHART_DATA',
          payload: { chartData },
        });
        break;
        
      case 'PARSE_FILE_2_FOR_MERGE':
        Papa.parse(payload.file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            SECONDARY_DATASET = results.data;
            self.postMessage({
              type: 'SUCCESS_PARSE_FILE_2',
              payload: {
                message: `File 2 loaded with ${SECONDARY_DATASET.length} rows. Ready to merge.`,
                headers: Object.keys(SECONDARY_DATASET[0] || {}),
              },
            });
          },
          error: (err) => {
            throw new Error(err.message);
          },
        });
        return;

      case 'PERFORM_MERGE':
        performMerge(payload.key1, payload.key2, payload.joinType);
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
            message: `Merge complete. Total rows: ${FULL_DATASET.length}`,
          },
        });
        break;

      // --- NEW: Handle edits from EditableTable ---
      case 'UPDATE_DATA_FROM_EDIT':
        if (!payload.data || !Array.isArray(payload.data)) {
          throw new Error('Invalid data provided for update.');
        }
        
        const editedData = payload.data;
        
        // Re-add row IDs to edited data based on current VIEW_DATASET
        const editedWithIds = editedData.map((editedRow, index) => {
          const originalRow = VIEW_DATASET[index];
          if (originalRow && originalRow._rowId !== undefined) {
            return {
              _rowId: originalRow._rowId,
              ...editedRow
            };
          }
          return editedRow;
        });
        
        // Update FULL_DATASET using row IDs
        editedWithIds.forEach((editedRow) => {
          if (editedRow._rowId !== undefined) {
            const originalIndex = FULL_DATASET.findIndex(
              row => row._rowId === editedRow._rowId
            );
            
            if (originalIndex !== -1) {
              FULL_DATASET[originalIndex] = { ...editedRow };
            } else {
              console.warn('⚠️ Could not find row with ID:', editedRow._rowId);
            }
          } else {
            console.warn('⚠️ Edited row missing _rowId:', editedRow);
          }
        });
        
        // Recalculate summary in case data types changed
        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        
        // Refresh VIEW_DATASET to reflect changes
        result = updateViewDataset();
        
        console.log('✅ Data synced from edit:', editedData.length, 'rows updated');
        
        // Send back updated data
        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: {
            previewData: result.preview,
            formattingMap: result.formattingMap,
            rowCount: VIEW_DATASET.length,
            summary: DATA_SUMMARY,
          },
        });
        break;

      // --- NEW FEATURES END HERE ---

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (err) {
    console.error('Error in worker:', err);
    self.postMessage({
      type: 'ERROR',
      payload: { message: err.message },
    });
  }
};

// --- Data Processing Functions ---

function updateViewDataset() {
  VIEW_DATASET = filterData(currentFilter.keyword);
  if (currentSort.key) {
    sortData(currentSort.key, currentSort.direction);
  }
  
  const preview = VIEW_DATASET.slice(0, 20);
  const formattingMap = generateFormattingMap(preview);
  
  // Remove row IDs and apply column visibility before sending to UI
  const visiblePreview = removeRowIds(applyColumnVisibility(preview));

  return { preview: visiblePreview, formattingMap };
}

function analyzeData(data) {
  if (data.length === 0) {
    return { headers: [], dataTypes: {}, totalRows: 0 };
  }

  const headers = Object.keys(data[0] || {});
  const dataTypes = {};
  const sample = data.slice(0, 100);

  for (const header of headers) {
    let inferredType = 'string';
    const values = sample
      .map(row => row[header])
      .filter(val => val !== null && val !== undefined && val !== '');

    if (values.length > 0) {
      const firstValue = values[0];
      
      if (typeof firstValue === 'number') {
        inferredType = 'number';
      } else if (typeof firstValue === 'boolean') {
        inferredType = 'boolean';
      } else if (typeof firstValue === 'string') {
        // Check if it's a date
        const dateCheck = new Date(firstValue);
        if (!isNaN(dateCheck.getTime()) && firstValue.match(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/)) {
          inferredType = 'date';
        } else {
          inferredType = 'string';
        }
      }
    }

    dataTypes[header] = inferredType;
  }

  return {
    headers: headers,
    dataTypes: dataTypes,
    totalRows: data.length,
  };
}

function sortData(key, direction = 'asc') {
  if (!DATA_SUMMARY) return;

  const type = DATA_SUMMARY.dataTypes[key];
  const dir = direction === 'asc' ? 1 : -1;

  VIEW_DATASET.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (valA == null) return 1;
    if (valB == null) return -1;

    let compare = 0;
    if (type === 'number') {
      compare = valA - valB;
    } else if (type === 'date') {
      compare = new Date(valA) - new Date(valB);
    } else {
      compare = String(valA).localeCompare(String(valB));
    }

    return compare * dir;
  });
}

function filterData(keyword) {
  const lowerCaseKeyword = String(keyword || '').toLowerCase().trim();

  if (!lowerCaseKeyword) {
    return FULL_DATASET.slice();
  }

  return FULL_DATASET.filter(row => {
    // Don't search in _rowId
    return Object.entries(row).some(([key, value]) => {
      if (key === '_rowId') return false;
      return String(value || '').toLowerCase().includes(lowerCaseKeyword);
    });
  });
}

function applyColumnVisibility(data) {
  if (hiddenColumns.size === 0) return data;
  
  return data.map(row => {
    const newRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (!hiddenColumns.has(key)) {
        newRow[key] = value;
      }
    }
    return newRow;
  });
}

function renameColumn(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;
  
  // Update all datasets
  FULL_DATASET = FULL_DATASET.map(row => {
    const newRow = { ...row };
    if (oldName in newRow) {
      newRow[newName] = newRow[oldName];
      delete newRow[oldName];
    }
    return newRow;
  });

  VIEW_DATASET = VIEW_DATASET.map(row => {
    const newRow = { ...row };
    if (oldName in newRow) {
      newRow[newName] = newRow[oldName];
      delete newRow[oldName];
    }
    return newRow;
  });

  // Update hidden columns
  if (hiddenColumns.has(oldName)) {
    hiddenColumns.delete(oldName);
    hiddenColumns.add(newName);
  }

  // Update sort key if needed
  if (currentSort.key === oldName) {
    currentSort.key = newName;
  }

  // Track rename
  columnRenames[oldName] = newName;
}

function removeDuplicates(columns = null) {
  const seen = new Set();
  
  FULL_DATASET = FULL_DATASET.filter(row => {
    // Exclude _rowId from duplicate check
    const checkRow = { ...row };
    delete checkRow._rowId;
    
    // If specific columns provided, only check those
    const key = columns && columns.length > 0
      ? columns.map(col => checkRow[col]).join('|')
      : Object.values(checkRow).join('|');
    
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function handleMissingData(strategy, columns = null, fillValue = null) {
  const targetCols = columns || DATA_SUMMARY.headers;

  if (strategy === 'drop') {
    // Remove rows with any missing values in target columns
    FULL_DATASET = FULL_DATASET.filter(row => {
      return targetCols.every(col => {
        const val = row[col];
        return val !== null && val !== undefined && val !== '';
      });
    });
  } else if (strategy === 'fill') {
    // Fill missing values
    FULL_DATASET = FULL_DATASET.map(row => {
      const newRow = { ...row };
      targetCols.forEach(col => {
        const val = newRow[col];
        if (val === null || val === undefined || val === '') {
          const colType = DATA_SUMMARY.dataTypes[col];
          
          if (fillValue !== null && fillValue !== undefined) {
            newRow[col] = fillValue;
          } else if (colType === 'number') {
            // Fill with mean
            const values = FULL_DATASET
              .map(r => r[col])
              .filter(v => typeof v === 'number');
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            newRow[col] = mean;
          } else {
            newRow[col] = 'N/A';
          }
        }
      });
      return newRow;
    });
  } else if (strategy === 'forward-fill') {
    // Forward fill: use previous row's value
    let lastValues = {};
    FULL_DATASET = FULL_DATASET.map(row => {
      const newRow = { ...row };
      targetCols.forEach(col => {
        const val = newRow[col];
        if (val === null || val === undefined || val === '') {
          newRow[col] = lastValues[col] || 'N/A';
        } else {
          lastValues[col] = val;
        }
      });
      return newRow;
    });
  }
}

function computeAggregations(columns = null) {
  const targetCols = columns || DATA_SUMMARY.headers.filter(
    h => DATA_SUMMARY.dataTypes[h] === 'number'
  );

  const results = {};

  targetCols.forEach(col => {
    const values = FULL_DATASET
      .map(row => row[col])
      .filter(val => typeof val === 'number' && !isNaN(val));

    if (values.length === 0) {
      results[col] = { count: 0, sum: 0, mean: 0, min: 0, max: 0, median: 0 };
      return;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = values.slice().sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    results[col] = {
      count: values.length,
      sum: sum,
      mean: mean,
      min: Math.min(...values),
      max: Math.max(...values),
      median: median,
    };
  });

  return results;
}

// --- ORIGINAL FEATURES (EXISTING) ---

function addRow(rowData) {
  // Ensure new row has all headers, even if null
  const newRow = {
    _rowId: ROW_ID_COUNTER++,
  };
  DATA_SUMMARY.headers.forEach(header => {
    newRow[header] = rowData[header] || null;
  });
  FULL_DATASET.push(newRow);
}

function addColumn(columnName, defaultValue) {
  if (DATA_SUMMARY.headers.includes(columnName)) {
    throw new Error(`Column "${columnName}" already exists.`);
  }

  FULL_DATASET.forEach(row => {
    row[columnName] = defaultValue || null;
  });
}

// --- NEW FEATURE HELPER FUNCTIONS ---

/**
 * Creates a "safe" function from a user-provided formula string.
 * Replaces [Column Name] with row["Column Name"] for safe execution.
 * @param {string} formula - The user's formula, e.g., "[Price] * [Quantity]"
 * @returns {Function} A function that takes a 'row' object and returns the result.
 */
function createSafeFormula(formula) {
  let parsedFormula = formula.replace(/\[([^\]]+)\]/g, (match, colName) => {
    // Escape quotes in column names
    const safeColName = colName.replace(/"/g, '\\"');
    return `row["${safeColName}"]`;
  });

  // A sandboxed function
  const formulaFunction = new Function('row', `
    try {
      const { PI, abs, acos, asin, atan, ceil, cos, exp, floor, log, max, min, pow, random, round, sin, sqrt, tan } = Math;
      
      return ${parsedFormula};
    } catch(e) {
      return \`#ERROR!\`;
    }
  `);
  
  return formulaFunction;
}

/**
 * Adds a new column to the dataset by applying a formula to each row.
 */
function addFormulaColumn(newColumnName, formulaString) {
  if (DATA_SUMMARY.headers.includes(newColumnName)) {
    throw new Error(`Column "${newColumnName}" already exists.`);
  }

  const formulaFunc = createSafeFormula(formulaString);
  
  FULL_DATASET.forEach(row => {
    row[newColumnName] = formulaFunc(row);
  });
}

/**
 * Checks if a value meets a condition.
 * @param {*} value - The cell's value.
 * @param {string} operator - e.g., '>', '<', '==', 'contains', '!='
 * @param {*} checkValue - The value to compare against.
 * @returns {boolean}
 */
function checkCondition(value, operator, checkValue) {
  const numValue = parseFloat(value);
  const numCheckValue = parseFloat(checkValue);

  switch (operator) {
    case '>':
      return !isNaN(numValue) && !isNaN(numCheckValue) && numValue > numCheckValue;
    case '<':
      return !isNaN(numValue) && !isNaN(numCheckValue) && numValue < numCheckValue;
    case '==':
      return value == checkValue;
    case '!=':
      return value != checkValue;
    case 'contains':
      return String(value || '').toLowerCase().includes(String(checkValue || '').toLowerCase());
    case 'not_contains':
      return !String(value || '').toLowerCase().includes(String(checkValue || '').toLowerCase());
    case 'is_empty':
      return value === null || value === undefined || value === '';
    case 'is_not_empty':
      return value !== null && value !== undefined && value !== '';
    default:
      return false;
  }
}

/**
 * Generates a map of { rowIndex: { colName: styleClass } } for the provided data.
 * @param {Array<object>} data - The dataset to scan (usually the preview).
 * @returns {object} The formatting map.
 */
function generateFormattingMap(data) {
  const map = {};
  if (conditionalFormats.length === 0) {
    return map;
  }

  data.forEach((row, rowIndex) => {
    conditionalFormats.forEach(format => {
      const { column, operator, value, styleClass } = format;
      const cellValue = row[column];
      
      if (checkCondition(cellValue, operator, value)) {
        if (!map[rowIndex]) {
          map[rowIndex] = {};
        }
        map[rowIndex][column] = styleClass; 
      }
    });
  });

  return map;
}

/**
 * Groups data by a key and performs aggregations.
 * @param {string} groupKey - The column to group by.
 * @param {object} aggregations - e.g., { 'Sales': 'sum', 'Rating': 'mean' }
 * @returns {Array<object>} The new grouped data.
 */
function groupAndAggregate(groupKey, aggregations) {
  const groups = new Map();

  // Pass 1: Accumulate values
  FULL_DATASET.forEach(row => {
    const key = row[groupKey];
    if (!groups.has(key)) {
      groups.set(key, {});
    }
    
    const group = groups.get(key);

    for (const [col, fn] of Object.entries(aggregations)) {
      const val = row[col];
      if (typeof val !== 'number') continue;

      if (!group[col]) {
        group[col] = { sum: 0, count: 0, min: Infinity, max: -Infinity, values: [] };
      }
      
      const acc = group[col];
      acc.sum += val;
      acc.count++;
      if (val < acc.min) acc.min = val;
      if (val > acc.max) acc.max = val;
      if (fn === 'median') acc.values.push(val);
    }
  });

  // Pass 2: Finalize calculations and build result
  const result = [];
  for (const [key, group] of groups.entries()) {
    const newRow = { [groupKey]: key };
    
    for (const [col, fn] of Object.entries(aggregations)) {
      const acc = group[col];
      if (!acc) {
        newRow[col] = null;
        continue;
      }

      switch (fn) {
        case 'sum':
          newRow[col] = acc.sum;
          break;
        case 'mean':
          newRow[col] = acc.count > 0 ? acc.sum / acc.count : 0;
          break;
        case 'count':
          newRow[col] = acc.count;
          break;
        case 'min':
          newRow[col] = acc.min === Infinity ? null : acc.min;
          break;
        case 'max':
          newRow[col] = acc.max === -Infinity ? null : acc.max;
          break;
        case 'median':
          if (acc.values.length === 0) {
            newRow[col] = null;
          } else {
            acc.values.sort((a, b) => a - b);
            const mid = Math.floor(acc.values.length / 2);
            newRow[col] = acc.values.length % 2 === 0
              ? (acc.values[mid - 1] + acc.values[mid]) / 2
              : acc.values[mid];
          }
          break;
        default:
          newRow[col] = null;
      }
    }
    result.push(newRow);
  }

  return result;
}

/**
 * Generates data for a pivot table.
 * @param {string} rowKey - Column for rows.
 * @param {string} colKey - Column for columns.
 * @param {string} aggCol - Column to aggregate.
 * @param {string} aggFn - Aggregation function ('sum', 'count', 'mean').
 * @returns {Array<object>} The pivot table data.
 */
function generatePivotTable(rowKey, colKey, aggCol, aggFn) {
  const pivot = new Map();
  const allColKeys = new Set();

  // Pass 1: Build the nested map and discover all column keys
  FULL_DATASET.forEach(row => {
    const rKey = row[rowKey];
    const cKey = row[colKey];
    const val = row[aggCol];

    if (rKey === undefined || cKey === undefined) return;
    
    allColKeys.add(cKey);

    if (!pivot.has(rKey)) {
      pivot.set(rKey, new Map());
    }
    const rowMap = pivot.get(rKey);

    if (!rowMap.has(cKey)) {
      rowMap.set(cKey, { sum: 0, count: 0, values: [] });
    }
    const cell = rowMap.get(cKey);
    
    if (typeof val === 'number') {
      cell.sum += val;
      cell.count++;
      cell.values.push(val);
    } else if (aggFn === 'count') {
      cell.count++;
    }
  });

  const sortedColKeys = Array.from(allColKeys).sort((a, b) => String(a).localeCompare(String(b)));
  
  // Pass 2: Flatten the map into a table
  const result = [];
  for (const [rKey, rowMap] of pivot.entries()) {
    const newRow = { [rowKey]: rKey };
    
    for (const cKey of sortedColKeys) {
      const cell = rowMap.get(cKey);
      if (!cell || cell.count === 0) {
        newRow[cKey] = null;
        continue;
      }

      switch (aggFn) {
        case 'sum':
          newRow[cKey] = cell.sum;
          break;
        case 'count':
          newRow[cKey] = cell.count;
          break;
        case 'mean':
          newRow[cKey] = cell.count > 0 ? cell.sum / cell.count : 0;
          break;
        default:
          newRow[cKey] = null;
      }
    }
    result.push(newRow);
  }
  
  result.sort((a,b) => String(a[rowKey]).localeCompare(String(b[rowKey])));

  return result;
}

/**
 * Generates data formatted for a charting library.
 * @param {string} labelColumn - Column for chart labels (X-axis).
 * @param {Array<string>} dataColumns - Column(s) for chart data (Y-axis).
 * @param {string} chartType - 'bar', 'line', 'pie'.
 * @returns {object} Chart.js compatible data object.
 */
function getChartData(labelColumn, dataColumns, chartType) {
  const sourceData = VIEW_DATASET;
  
  const labels = [...new Set(sourceData.map(row => row[labelColumn]))];
  labels.sort((a,b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });

  const datasets = dataColumns.map(col => {
    if (chartType === 'pie' && dataColumns.length === 1) {
       const dataMap = new Map();
       sourceData.forEach(row => {
          const label = row[labelColumn];
          const val = row[col];
          if(typeof val === 'number') {
            dataMap.set(label, (dataMap.get(label) || 0) + val);
          }
       });
       return {
         label: col,
         data: labels.map(label => dataMap.get(label) || 0)
       };
    }

    const dataMap = new Map();
    sourceData.forEach(row => {
       const label = row[labelColumn];
       const val = row[col];
       if(typeof val === 'number') {
         dataMap.set(label, (dataMap.get(label) || 0) + val);
       }
    });

    return {
      label: col,
      data: labels.map(label => dataMap.get(label) || 0)
    };
  });

  return {
    labels: labels,
    datasets: datasets,
  };
}

/**
 * Merges SECONDARY_DATASET into FULL_DATASET.
 * @param {string} key1 - The join key for FULL_DATASET.
 * @param {string} key2 - The join key for SECONDARY_DATASET.
 * @param {string} joinType - 'left', 'inner', 'right', 'outer'.
 */
function performMerge(key1, key2, joinType) {
  if (SECONDARY_DATASET.length === 0) {
    throw new Error("No secondary dataset loaded for merge.");
  }

  const data1 = FULL_DATASET;
  const data2 = SECONDARY_DATASET;
  
  const data2Map = new Map();
  const data2Headers = Object.keys(data2[0] || {}).filter(h => h !== key2);
  data2.forEach(row => {
    const key = row[key2];
    if (key !== null && key !== undefined) {
      if (!data2Map.has(key)) {
        data2Map.set(key, []);
      }
      data2Map.get(key).push(row);
    }
  });

  const mergedData = [];

  if (joinType === 'left' || joinType === 'inner') {
    data1.forEach(row1 => {
      const joinVal = row1[key1];
      const matchingRows2 = data2Map.get(joinVal);

      if (matchingRows2 && matchingRows2.length > 0) {
        matchingRows2.forEach(row2 => {
          const mergedRow = { ...row1 };
          data2Headers.forEach(header => {
            const newHeader = header in row1 ? `${header}_2` : header;
            mergedRow[newHeader] = row2[header];
          });
          mergedData.push(mergedRow);
        });
      } else if (joinType === 'left') {
        const mergedRow = { ...row1 };
        data2Headers.forEach(header => {
          const newHeader = header in row1 ? `${header}_2` : header;
          mergedRow[newHeader] = null;
        });
        mergedData.push(mergedRow);
      }
    });
  }

  FULL_DATASET = mergedData;
  SECONDARY_DATASET = [];
}
