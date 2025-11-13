// This file runs in a separate thread (a Web Worker)
import Papa from 'papaparse';

console.log('Worker script loaded with PapaParse.');

// --- Worker State ---
let FULL_DATASET = [];
let VIEW_DATASET = []; // Holds the filtered and sorted data
let DATA_SUMMARY = {}; // Holds headers, data types, etc.
let currentSort = { key: null, direction: 'asc' }; // Track current sort state
let currentFilter = { keyword: '' }; // Track current filter state

// --- Worker Event Listener ---
self.onmessage = (event) => {
  const { type, payload } = event.data;
  console.log('Message received in worker:', type);

  try {
    const startTime = performance.now();
    let resultPreview;

    switch (type) {
      // This is the primary "load" task
      case 'PARSE_FILE':
        Papa.parse(payload.file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            FULL_DATASET = results.data;
            VIEW_DATASET = FULL_DATASET; // Initialize VIEW_DATASET
            DATA_SUMMARY = analyzeData(FULL_DATASET); // Analyze the full set
            
            const endTime = performance.now();
            console.log(`Parsing took ${(endTime - startTime).toFixed(2)}ms`);

            // Send back the summary and a preview of the *view*
            self.postMessage({
              type: 'SUCCESS_ANALYSIS',
              payload: {
                summary: DATA_SUMMARY,
                previewData: VIEW_DATASET.slice(0, 20),
              },
            });
          },
          error: (err) => {
            throw new Error(err.message);
          },
        });
        return; // PapaParse is async, so we return here

      case 'SORT_DATA':
        currentSort = {
          key: payload?.key ?? currentSort.key,
          direction: payload?.direction ?? currentSort.direction,
        };
        resultPreview = updateViewDataset();

        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: { previewData: resultPreview, rowCount: VIEW_DATASET.length },
        });
        break;

      // --- Filtering/Search ---
      case 'FILTER_DATA':
        // Make sure we have a valid keyword
        currentFilter = { keyword: String(payload?.keyword ?? '').trim() };
        resultPreview = updateViewDataset();

        self.postMessage({
          type: 'SUCCESS_UPDATE',
          payload: { previewData: resultPreview, rowCount: VIEW_DATASET.length },
        });
        break;

      // --- Download Processed File ---
      case 'DOWNLOAD_FILE':
        // This converts the *current view* (filtered/sorted) back to a CSV string
        const csvString = Papa.unparse(VIEW_DATASET);
        const downloadEndTime = performance.now();
        console.log(`Unparsing for download took ${(downloadEndTime - startTime).toFixed(2)}ms`);

        self.postMessage({
          type: 'SUCCESS_DOWNLOAD',
          payload: { csvString: csvString },
        });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      payload: { message: err.message },
    });
  }
};

// --- Data Processing Functions ---

/**
 * Updates VIEW_DATASET by applying current filter and sort.
 * Returns a preview of the first 20 rows.
 */
function updateViewDataset() {
  // Step 1: Filter
  VIEW_DATASET = filterData(currentFilter.keyword);
  
  // Step 2: Sort (if a sort key is set)
  if (currentSort.key) {
    sortData(currentSort.key, currentSort.direction);
  }
  
  // Return preview
  return VIEW_DATASET.slice(0, 20);
}

/**
 * Analyzes the data to get headers, data types, and row count.
 * This function analyzes the *full* dataset.
 */
function analyzeData(data) {
  if (data.length === 0) {
    return { headers: [], dataTypes: {}, totalRows: 0 };
  }

  const headers = Object.keys(data[0]);
  const dataTypes = {};
  const sample = data.slice(0, 100);

  for (const header of headers) {
    let inferredType = 'string';
    const firstRowWithValue = sample.find(
      (row) => row[header] !== null && row[header] !== undefined
    );
    const firstValue = firstRowWithValue?.[header];
    
    if (firstValue === undefined) {
      inferredType = 'string';
    } else if (typeof firstValue === 'number') {
      inferredType = 'number';
    } else if (typeof firstValue === 'boolean') {
      inferredType = 'boolean';
    }

    dataTypes[header] = inferredType;
  }

  return {
    headers: headers,
    dataTypes: dataTypes,
    totalRows: data.length, // Total rows in the *original* file
  };
}

/**
 * Sorts the VIEW_DATASET in place.
 */
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
    } else {
      compare = String(valA).localeCompare(String(valB));
    }

    return compare * dir;
  });
}

/**
 * Filters the FULL_DATASET based on a keyword.
 * Returns a new array (the new VIEW_DATASET).
 */
function filterData(keyword) {
  const lowerCaseKeyword = String(keyword || '').toLowerCase().trim();

  // If no keyword, return the full, original dataset
  if (!lowerCaseKeyword) {
    return FULL_DATASET.slice(); // Return a copy
  }

  // Filter the original dataset
  return FULL_DATASET.filter(row => {
    // `Object.values` gets all values (name, email, age, etc.) from a row
    // `some` checks if *at least one* value includes the keyword
    return Object.values(row).some(value => 
      String(value || '').toLowerCase().includes(lowerCaseKeyword)
    );
  });
}