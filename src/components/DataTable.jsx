import React from 'react';

/**
 * Renders a dynamic table with Tailwind CSS styling.
 */
function DataTable({ headers, data, totalRows }) {
  const previewCount = data.length;

  return (
    <section className="mt-8 bg-white shadow-md rounded-2xl p-6">
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center justify-between">
        3️⃣ Data Preview
        <span className="text-sm font-normal text-gray-500">
          (Showing first {previewCount} of {totalRows} rows)
        </span>
      </h2>

      <div className="overflow-x-auto mt-4 rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 border-b border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-100 transition`}
              >
                {headers.map((header) => (
                  <td
                    key={header}
                    className="px-6 py-3 border-b border-gray-100 text-gray-700"
                  >
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DataTable;
