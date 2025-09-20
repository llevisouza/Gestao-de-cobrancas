// src/components/reports/DateFilter.js
import React from 'react';

const DateFilter = ({ startDate, setStartDate, endDate, setEndDate, onGenerate }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row items-center gap-4 mb-6">
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700">Data Início</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700">Data Fim</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="w-full sm:w-auto mt-2 sm:mt-0">
         <button onClick={onGenerate} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 sm:mt-5">
           Gerar Relatório
        </button>
      </div>
    </div>
  );
};

export default DateFilter;