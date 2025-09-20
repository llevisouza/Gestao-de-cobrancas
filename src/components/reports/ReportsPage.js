// src/components/reports/ReportsPage.js
import React, { useState } from 'react';
import DateFilter from './DateFilter';
import ReportTable from './ReportTable';
import { getStartOfMonth, formatDateToYYYYMMDD } from '../../utils/dateUtils';
import { MESSAGES } from '../../utils/constants';

const ReportsPage = ({ invoices }) => {
  const [startDate, setStartDate] = useState(formatDateToYYYYMMDD(getStartOfMonth()));
  const [endDate, setEndDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [filteredData, setFilteredData] = useState([]);
  const [wasGenerated, setWasGenerated] = useState(false);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      alert(MESSAGES.ERROR.REPORT_DATE_REQUIRED);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Adiciona 1 dia ao fim para incluir o dia inteiro na busca
    end.setDate(end.getDate() + 1);

    const filtered = invoices.filter(invoice => {
      const generationDate = new Date(invoice.generationDate);
      return generationDate >= start && generationDate < end;
    });

    setFilteredData(filtered);
    setWasGenerated(true);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Relatório de Faturas</h1>
      <DateFilter
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onGenerate={handleGenerateReport}
      />
      {wasGenerated && <ReportTable data={filteredData} />}
    </div>
  );
};

export default ReportsPage;