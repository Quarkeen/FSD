// This file runs in a separate thread (a Web Worker)
import Papa from 'papaparse';

console.log('Worker script loaded with PapaParse.');

// --- Worker State ---
let FULL_DATASET = [];
let VIEW_DATASET = [];
let SECONDARY_DATASET = [];
let DATA_SUMMARY = {};
let currentSort = { key: null, direction: 'asc' };
let currentFilter = { keyword: '' };
let hiddenColumns = new Set();
let columnRenames = {};
let conditionalFormats = [];
let ROW_ID_COUNTER = 0;

// --- Helper Functions for Row ID Management ---

function addRowIds(data) {
  return data.map((row) => ({
    _rowId: ROW_ID_COUNTER++,
    ...row
  }));
}

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
    let result;

    switch (type) {
      case 'PARSE_FILE':
        Papa.parse(payload.file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            FULL_DATASET = addRowIds(results.data);
            VIEW_DATASET = FULL_DATASET.slice();
            DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
            hiddenColumns.clear();
            hiddenColumns.add('_rowId');
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
          payload: { csvString: csvString },
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
        conditionalFormats.push(payload.rule);
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
            message: `${payload.joinType.toUpperCase()} join complete. Total rows: ${FULL_DATASET.length}`,
          },
        });
        break;

      case 'UPDATE_DATA_FROM_EDIT':
        if (!payload.data || !Array.isArray(payload.data)) {
          throw new Error('Invalid data provided for update.');
        }

        const editedData = payload.data;
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

        DATA_SUMMARY = analyzeData(removeRowIds(FULL_DATASET));
        result = updateViewDataset();

        console.log('✅ Data synced from edit:', editedData.length, 'rows updated');

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

  if (hiddenColumns.has(oldName)) {
    hiddenColumns.delete(oldName);
    hiddenColumns.add(newName);
  }

  if (currentSort.key === oldName) {
    currentSort.key = newName;
  }

  columnRenames[oldName] = newName;
}

function removeDuplicates(columns = null) {
  const seen = new Set();

  FULL_DATASET = FULL_DATASET.filter(row => {
    const checkRow = { ...row };
    delete checkRow._rowId;

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
    FULL_DATASET = FULL_DATASET.filter(row => {
      return targetCols.every(col => {
        const val = row[col];
        return val !== null && val !== undefined && val !== '';
      });
    });
  } else if (strategy === 'fill') {
    FULL_DATASET = FULL_DATASET.map(row => {
      const newRow = { ...row };
      targetCols.forEach(col => {
        const val = newRow[col];
        if (val === null || val === undefined || val === '') {
          const colType = DATA_SUMMARY.dataTypes[col];

          if (fillValue !== null && fillValue !== undefined) {
            newRow[col] = fillValue;
          } else if (colType === 'number') {
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

function addRow(rowData) {
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

function createSafeFormula(formula) {
  let parsedFormula = formula.replace(/\[([^\]]+)\]/g, (match, colName) => {
    const safeColName = colName.replace(/"/g, '\\"');
    return `row["${safeColName}"]`;
  });

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

function addFormulaColumn(newColumnName, formulaString) {
  if (DATA_SUMMARY.headers.includes(newColumnName)) {
    throw new Error(`Column "${newColumnName}" already exists.`);
  }

  const formulaFunc = createSafeFormula(formulaString);

  FULL_DATASET.forEach(row => {
    row[newColumnName] = formulaFunc(row);
  });
}

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

function groupAndAggregate(groupKey, aggregations) {
  const groups = new Map();

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

function generatePivotTable(rowKey, colKey, aggCol, aggFn) {
  const pivot = new Map();
  const allColKeys = new Set();

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

  result.sort((a, b) => String(a[rowKey]).localeCompare(String(b[rowKey])));

  return result;
}

function getChartData(labelColumn, dataColumns, chartType) {
  const sourceData = VIEW_DATASET;

  const labels = [...new Set(sourceData.map(row => row[labelColumn]))];
  labels.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });

  const datasets = dataColumns.map(col => {
    if (chartType === 'pie' && dataColumns.length === 1) {
      const dataMap = new Map();
      sourceData.forEach(row => {
        const label = row[labelColumn];
        const val = row[col];
        if (typeof val === 'number') {
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
      if (typeof val === 'number') {
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
 * UPDATED: Merges SECONDARY_DATASET into FULL_DATASET with ALL join types.
 * @param {string} key1 - The join key for FULL_DATASET.
 * @param {string} key2 - The join key for SECONDARY_DATASET.
 * @param {string} joinType - 'left', 'right', 'inner', 'outer', 'cross'.
 */
function performMerge(key1, key2, joinType) {
  if (SECONDARY_DATASET.length === 0) {
    throw new Error("No secondary dataset loaded for merge.");
  }

  const data1 = FULL_DATASET;
  const data2 = SECONDARY_DATASET;

  // Create a hash map from data2 for faster lookups
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
  const matchedData2Keys = new Set();

  // Helper function to merge two rows
  const mergeRows = (row1, row2) => {
    const merged = { ...row1 };
    if (row2) {
      data2Headers.forEach(header => {
        const newHeader = header in row1 ? `${header}_2` : header;
        merged[newHeader] = row2[header];
      });
    } else {
      // Add null values for data2 columns
      data2Headers.forEach(header => {
        const newHeader = header in row1 ? `${header}_2` : header;
        merged[newHeader] = null;
      });
    }
    return merged;
  };

  // LEFT JOIN
  if (joinType === 'left') {
    data1.forEach(row1 => {
      const joinVal = row1[key1];
      const matchingRows2 = data2Map.get(joinVal);

      if (matchingRows2 && matchingRows2.length > 0) {
        matchingRows2.forEach(row2 => {
          mergedData.push(mergeRows(row1, row2));
          matchedData2Keys.add(joinVal);
        });
      } else {
        mergedData.push(mergeRows(row1, null));
      }
    });
  }
  
  // RIGHT JOIN
  else if (joinType === 'right') {
    data2.forEach(row2 => {
      const joinVal = row2[key2];
      const matchingRows1 = data1.filter(r => r[key1] === joinVal);
      
      if (matchingRows1.length > 0) {
        matchingRows1.forEach(row1 => {
          mergedData.push(mergeRows(row1, row2));
        });
      } else {
        // No match in data1, add data2 row with nulls for data1 columns
        const merged = {};
        Object.keys(data1[0] || {}).forEach(header => {
          merged[header] = null;
        });
        data2Headers.forEach(header => {
          const newHeader = header in merged ? `${header}_2` : header;
          merged[newHeader] = row2[header];
        });
        merged[key2] = joinVal;
        mergedData.push(merged);
      }
    });
  }
  
  // INNER JOIN
  else if (joinType === 'inner') {
    data1.forEach(row1 => {
      const joinVal = row1[key1];
      const matchingRows2 = data2Map.get(joinVal);

      if (matchingRows2 && matchingRows2.length > 0) {
        matchingRows2.forEach(row2 => {
          mergedData.push(mergeRows(row1, row2));
        });
      }
      // If no match, row is dropped (inner join behavior)
    });
  }
  
  // FULL OUTER JOIN
  else if (joinType === 'outer') {
    // First add all matches and left-only rows
    data1.forEach(row1 => {
      const joinVal = row1[key1];
      const matchingRows2 = data2Map.get(joinVal);

      if (matchingRows2 && matchingRows2.length > 0) {
        matchingRows2.forEach(row2 => {
          mergedData.push(mergeRows(row1, row2));
          matchedData2Keys.add(joinVal);
        });
      } else {
        mergedData.push(mergeRows(row1, null));
      }
    });

    // Then add right-only rows (rows in data2 that weren't matched)
    data2.forEach(row2 => {
      const joinVal = row2[key2];
      if (!matchedData2Keys.has(joinVal)) {
        const merged = {};
        Object.keys(data1[0] || {}).forEach(header => {
          merged[header] = null;
        });
        data2Headers.forEach(header => {
          const newHeader = header in merged ? `${header}_2` : header;
          merged[newHeader] = row2[header];
        });
        merged[key2] = joinVal;
        mergedData.push(merged);
      }
    });
  }
  
  // CROSS JOIN (Cartesian Product)
  else if (joinType === 'cross') {
    // Safety check for large cross joins
    const estimatedRows = data1.length * data2.length;
    if (estimatedRows > 100000) {
      throw new Error(
        `Cross join would create ${estimatedRows.toLocaleString()} rows, which may freeze your browser. ` +
        `Maximum allowed: 100,000 rows. Please filter your data first.`
      );
    }
    
    console.log(`⚠️ Performing cross join: ${data1.length} × ${data2.length} = ${estimatedRows} rows`);
    
    data1.forEach(row1 => {
      data2.forEach(row2 => {
        mergedData.push(mergeRows(row1, row2));
      });
    });
  }
  
  else {
    throw new Error(`Unknown join type: ${joinType}`);
  }

  // Re-add row IDs to merged data
  FULL_DATASET = addRowIds(mergedData);
  SECONDARY_DATASET = [];
  
  console.log(`✅ ${joinType.toUpperCase()} join complete: ${mergedData.length} rows created from ${data1.length} and ${data2.length} rows`);
}
