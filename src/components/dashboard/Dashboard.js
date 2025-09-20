// src/components/dashboard/Dashboard.js
import React from 'react';
import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';

const Dashboard = ({ invoices, setInvoices, clients }) => {
  // Pega as 10 faturas mais recentes para exibir no dashboard
  const recentInvoices = invoices.slice(0, 10);

  return (
    <div className="space-y-8">
      <KPICards invoices={invoices} clients={clients} />

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Faturas Recentes</h2>
        <InvoiceTable invoices={recentInvoices} setInvoices={setInvoices} />
      </div>
    </div>
  );
};

export default Dashboard;