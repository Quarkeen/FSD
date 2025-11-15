import React, { useState, useEffect } from 'react';
import SortControls from './SortControls';
import FilterControls from './FilterControls';
import ColumnManagement from './ColumnManagement';
import DataCleaning from './DataCleaning';
import AdvancedTools from './AdvancedTools/AdvancedTools';
import Statistics from './Statistics';
import ResultsDisplay from './ResultsDisplay';
import DownloadSection from './DownloadSection';

function DynamicControlPanel({ 
  summary, 
  isProcessing, 
  onProcess, 
  hiddenColumns = [], 
  worker, 
  data,
  activeTool // NEW PROP - tells which tool to show
}) {
  const [sortColumn, setSortColumn] = useState(summary.headers[0]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showAggregations, setShowAggregations] = useState(false);
  const [aggregationResults, setAggregationResults] = useState(null);
  const [renameColumn, setRenameColumn] = useState({ old: '', new: '' });
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  
  const [groupedData, setGroupedData] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [chartData, setChartData] = useState(null);
  
  const allHeaders = summary.headers.map(h => ({ name: h, type: summary.dataTypes[h] }));
  const numericHeaders = allHeaders.filter(h => h.type === 'number').map(h => h.name);

  useEffect(() => {
    if (!worker) return;

    const handleWorkerMessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'SUCCESS_AGGREGATIONS':
          setAggregationResults(payload.aggregations);
          setShowAggregations(true);
          break;
        case 'SUCCESS_GROUPING':
          setGroupedData(payload.groupedData);
          setPivotData(null);
          setChartData(null);
          alert(payload.message);
          break;
        case 'SUCCESS_PIVOT':
          setPivotData(payload.pivotData);
          setGroupedData(null);
          setChartData(null);
          alert(payload.message);
          break;
        case 'SUCCESS_CHART_DATA':
          setChartData(payload.chartData);
          setGroupedData(null);
          setPivotData(null);
          break;
        case 'SUCCESS_PARSE_FILE_2':
          alert(payload.message);
          break;
      }
    };

    worker.addEventListener('message', handleWorkerMessage);
    return () => worker.removeEventListener('message', handleWorkerMessage);
  }, [worker]);

  // Render only the selected tool component
  const renderActiveTool = () => {
    if (!activeTool) return null;

    switch (activeTool) {
      case 'sort':
        return (
          <SortControls
            sortColumn={sortColumn}
            setSortColumn={setSortColumn}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            allHeaders={allHeaders}
            isProcessing={isProcessing}
            onProcess={onProcess}
          />
        );

      case 'filter':
        return (
          <FilterControls
            filterKeyword={filterKeyword}
            setFilterKeyword={setFilterKeyword}
            isProcessing={isProcessing}
            onProcess={onProcess}
          />
        );

      case 'columns':
        return (
          <ColumnManagement
            allHeaders={allHeaders}
            hiddenColumns={hiddenColumns}
            showColumnManager={showColumnManager}
            setShowColumnManager={setShowColumnManager}
            renameColumn={renameColumn}
            setRenameColumn={setRenameColumn}
            showRenameDialog={showRenameDialog}
            setShowRenameDialog={setShowRenameDialog}
            onProcess={onProcess}
          />
        );

      case 'cleaning':
        return (
          <DataCleaning
            isProcessing={isProcessing}
            onProcess={onProcess}
          />
        );

      case 'advanced':
      case 'grouping':
      case 'pivot':
      case 'merge':
      case 'formula':
      case 'chart':
        return (
          <AdvancedTools
            summary={summary}
            data={data}
            allHeaders={allHeaders}
            numericHeaders={numericHeaders}
            onProcess={onProcess}
            worker={worker}
          />
        );

      case 'statistics':
        return (
          <Statistics
            numericHeaders={numericHeaders}
            isProcessing={isProcessing}
            showAggregations={showAggregations}
            aggregationResults={aggregationResults}
            onProcess={onProcess}
          />
        );

      case 'download':
        return (
          <DownloadSection
            isProcessing={isProcessing}
            downloading={downloading}
            setDownloading={setDownloading}
            onProcess={onProcess}
          />
        );

      default:
        return (
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <p className="text-gray-600">
              Tool component for "{activeTool}" is not yet configured.
            </p>
          </div>
        );
    }
  };

  return (
    <section className="dynamic-control-panel space-y-6">
      {/* Only render the active tool */}
      {renderActiveTool()}

      {/* Results Display - Always show if there are results */}
      {(groupedData || pivotData || chartData) && (
        <div className="mt-6">
          <ResultsDisplay
            groupedData={groupedData}
            pivotData={pivotData}
            chartData={chartData}
          />
        </div>
      )}
    </section>
  );
}

export default DynamicControlPanel;
