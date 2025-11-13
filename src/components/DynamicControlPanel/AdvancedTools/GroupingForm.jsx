import React, { useState } from 'react';
import AggregationRule from '../../shared/AggregationRule';

function GroupingForm({ allHeaders, numericHeaders, onProcess }) {
  const [groupState, setGroupState] = useState({
    groupKey: allHeaders[0]?.name || '',
    rules: [{ id: 1, column: '', fn: 'sum' }],
  });

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    const aggregations = groupState.rules.reduce((acc, rule) => {
      if (rule.column && rule.fn) {
        acc[rule.column] = rule.fn;
      }
      return acc;
    }, {});

    if (Object.keys(aggregations).length === 0) {
      alert('Please add at least one valid aggregation rule.');
      return;
    }

    onProcess('GROUP_AND_AGGREGATE', {
      groupKey: groupState.groupKey,
      aggregations: aggregations,
    });
  };

  const handleUpdateGroupRule = (index, field, value) => {
    const newRules = [...groupState.rules];
    newRules[index][field] = value;
    setGroupState({ ...groupState, rules: newRules });
  };

  const handleAddGroupRule = () => {
    setGroupState({
      ...groupState,
      rules: [...groupState.rules, { id: Date.now(), column: '', fn: 'sum' }],
    });
  };

  const handleRemoveGroupRule = (index) => {
    const newRules = groupState.rules.filter((_, i) => i !== index);
    setGroupState({ ...groupState, rules: newRules });
  };

  return (
    <form onSubmit={handleGroupSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Group and Aggregate</h4>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
        <select
          value={groupState.groupKey}
          onChange={(e) => setGroupState({ ...groupState, groupKey: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        >
          {allHeaders.map(h => (
            <option key={h.name} value={h.name}>{h.name}</option>
          ))}
        </select>
      </div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Aggregations</label>
      {groupState.rules.map((rule, index) => (
        <AggregationRule
          key={rule.id}
          headers={allHeaders}
          rule={rule}
          onChange={(field, value) => handleUpdateGroupRule(index, field, value)}
          onRemove={() => handleRemoveGroupRule(index)}
        />
      ))}
      <button
        type="button"
        onClick={handleAddGroupRule}
        className="text-sm text-blue-600 hover:text-blue-800 mb-3"
      >
        + Add Aggregation
      </button>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Run Grouping
      </button>
    </form>
  );
}

export default GroupingForm;
