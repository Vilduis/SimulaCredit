// Librerías de exportación se cargarán dinámicamente para reducir el bundle inicial

type RecentSimulationRow = {
  id: string;
  client: string;
  property: string;
  amount: number;
  date: string;
  status: string;
};

type TopClientRow = {
  id: string;
  name: string;
  simulations: number;
  loans: number;
  amount: number;
};

export function formatCurrencyPEN(value: number): string {
  try {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  } catch {
    return `S/ ${value.toFixed(2)}`;
  }
}

export async function exportReportsToPDF(opts: {
  recentSimulations: RecentSimulationRow[];
  topClients: TopClientRow[];
  periodLabel?: string;
}) {
  const { recentSimulations, topClients, periodLabel } = opts;
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Reportes y Estadísticas', 14, 18);
  doc.setFontSize(11);
  if (periodLabel) {
    doc.text(`Periodo: ${periodLabel}`, 14, 26);
  }

  // Top Clients table
  autoTable(doc, {
    startY: 32,
    head: [['Cliente', 'Simulaciones', 'Créditos', 'Monto Total', 'Estado']],
    body: topClients.map((c) => [
      c.name,
      String(c.simulations),
      String(c.loans),
      formatCurrencyPEN(c.amount),
      c.simulations > 0 ? 'Activo' : 'Prospecto',
    ]),
    styles: { fontSize: 10 },
    theme: 'grid',
  });

  // Recent simulations table
  autoTable(doc, {
    head: [['Cliente', 'Propiedad', 'Monto', 'Fecha', 'Estado']],
    body: recentSimulations.map((r) => [
      r.client,
      r.property,
      formatCurrencyPEN(r.amount),
      r.date,
      r.status === 'completed' ? 'Completada' : r.status,
    ]),
    styles: { fontSize: 10 },
    theme: 'grid',
  });

  doc.save(`reportes_${Date.now()}.pdf`);
}

export async function exportReportsToExcel(opts: {
  recentSimulations: RecentSimulationRow[];
  topClients: TopClientRow[];
  periodLabel?: string;
}) {
  const { recentSimulations, topClients, periodLabel } = opts;
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Top Clients sheet
  const topClientsAOA = [
    ['Cliente', 'Simulaciones', 'Créditos', 'Monto Total', 'Estado'],
    ...topClients.map((c) => [
      c.name,
      c.simulations,
      c.loans,
      c.amount,
      c.simulations > 0 ? 'Activo' : 'Prospecto',
    ]),
  ];
  const wsTop = XLSX.utils.aoa_to_sheet(topClientsAOA);
  // Ajustar anchos y formato de moneda en la columna Monto Total
  (wsTop as any)['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 12 }];
  for (let r = 2; r <= topClientsAOA.length; r++) {
    const addr = `D${r}`; // Columna Monto Total
    if ((wsTop as any)[addr]) (wsTop as any)[addr].z = '"S/ "#,##0.00';
  }
  XLSX.utils.book_append_sheet(wb, wsTop, 'TopClientes');

  // Recent Simulations sheet
  const recentAOA = [
    ['Cliente', 'Propiedad', 'Monto', 'Fecha', 'Estado'],
    ...recentSimulations.map((r) => [
      r.client,
      r.property,
      r.amount,
      r.date,
      r.status === 'completed' ? 'Completada' : r.status,
    ]),
  ];
  const wsRecent = XLSX.utils.aoa_to_sheet(recentAOA);
  // Ajustar anchos y formato de moneda en la columna Monto
  (wsRecent as any)['!cols'] = [{ wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
  for (let r = 2; r <= recentAOA.length; r++) {
    const addr = `C${r}`; // Columna Monto
    if ((wsRecent as any)[addr]) (wsRecent as any)[addr].z = '"S/ "#,##0.00';
  }
  XLSX.utils.book_append_sheet(wb, wsRecent, 'Simulaciones');

  // Metadata sheet (optional)
  if (periodLabel) {
    const meta = [['Periodo', periodLabel], ['Generado', new Date().toLocaleString('es-PE')]];
    const wsMeta = XLSX.utils.aoa_to_sheet(meta);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Meta');
  }

  XLSX.writeFile(wb, `reportes_${Date.now()}.xlsx`);
}

// Simulation result export (summary + amortization)
export async function exportSimulationToPDF(opts: {
  clientName?: string;
  propertyName?: string | null;
  config: { loanAmount: number; interestRate: number; termYears: number };
  result: {
    monthlyPayment: number;
    tcea: number;
    trea: number;
    totalAmount: number;
    totalInterest: number;
    amortizationTable: Array<{
      period: number;
      date: string;
      initialBalance: number;
      interest: number;
      payment: number;
      amortization: number;
      finalBalance: number;
    }>;
  };
}) {
  const { clientName, propertyName, config, result } = opts;
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Resultados de Simulación', 14, 18);
  doc.setFontSize(11);
  doc.text(`Cliente: ${clientName || 'Sin asignar'}`, 14, 26);
  doc.text(`Propiedad: ${propertyName || 'No especificada'}`, 14, 32);
  doc.text(`Monto: ${formatCurrencyPEN(config.loanAmount)}`, 14, 38);
  doc.text(`TEA: ${(config.interestRate).toFixed(2)}%`, 14, 44);
  doc.text(`Plazo: ${config.termYears} años`, 14, 50);

  autoTable(doc, {
    startY: 58,
    head: [['Indicador', 'Valor']],
    body: [
      ['Cuota Mensual', formatCurrencyPEN(result.monthlyPayment)],
      ['TCEA', `${(result.tcea).toFixed(2)}%`],
      ['TREA', `${(result.trea).toFixed(2)}%`],
      ['Monto Total', formatCurrencyPEN(result.totalAmount)],
      ['Interés Total', formatCurrencyPEN(result.totalInterest)],
    ],
    styles: { fontSize: 10 },
    theme: 'grid',
  });

  autoTable(doc, {
    head: [['Periodo', 'Fecha', 'Saldo Inicial', 'Interés', 'Cuota', 'Amortización', 'Saldo Final']],
    body: result.amortizationTable.map((r) => [
      r.period,
      r.date,
      formatCurrencyPEN(r.initialBalance),
      formatCurrencyPEN(r.interest),
      formatCurrencyPEN(r.payment),
      formatCurrencyPEN(r.amortization),
      formatCurrencyPEN(r.finalBalance),
    ]),
    styles: { fontSize: 9 },
    theme: 'grid',
  });

  doc.save(`simulacion_${Date.now()}.pdf`);
}

export async function exportSimulationToExcel(opts: {
  clientName?: string;
  propertyName?: string | null;
  config: { loanAmount: number; interestRate: number; termYears: number };
  result: {
    monthlyPayment: number;
    tcea: number;
    trea: number;
    totalAmount: number;
    totalInterest: number;
    amortizationTable: Array<{
      period: number;
      date: string;
      initialBalance: number;
      interest: number;
      payment: number;
      amortization: number;
      finalBalance: number;
    }>;
  };
}) {
  const { clientName, propertyName, config, result } = opts;
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summary = [
    ['Cliente', clientName || 'Sin asignar'],
    ['Propiedad', propertyName || 'No especificada'],
    ['Monto', config.loanAmount],
    ['TEA', config.interestRate / 100],
    ['Plazo (años)', config.termYears],
    ['Cuota Mensual', result.monthlyPayment],
    ['TCEA', result.tcea / 100],
    ['TREA', result.trea / 100],
    ['Monto Total', result.totalAmount],
    ['Interés Total', result.totalInterest],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  // Aplicar formato de porcentaje a TEA/TCEA/TREA
  if (wsSummary['B4']) wsSummary['B4'].z = '0.00%';
  if (wsSummary['B7']) wsSummary['B7'].z = '0.00%';
  if (wsSummary['B8']) wsSummary['B8'].z = '0.00%';
  // Formato de moneda para Monto, Cuota Mensual, Monto Total e Interés Total
  if ((wsSummary as any)['B3']) (wsSummary as any)['B3'].z = '"S/ "#,##0.00';
  if ((wsSummary as any)['B6']) (wsSummary as any)['B6'].z = '"S/ "#,##0.00';
  if ((wsSummary as any)['B9']) (wsSummary as any)['B9'].z = '"S/ "#,##0.00';
  if ((wsSummary as any)['B10']) (wsSummary as any)['B10'].z = '"S/ "#,##0.00';
  // Ajustar anchos de columnas del resumen
  (wsSummary as any)['!cols'] = [{ wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // Amortization sheet
  const amortAOA = [
    ['Periodo', 'Fecha', 'Saldo Inicial', 'Interés', 'Cuota', 'Amortización', 'Saldo Final'],
    ...result.amortizationTable.map((r) => [
      r.period,
      r.date,
      r.initialBalance,
      r.interest,
      r.payment,
      r.amortization,
      r.finalBalance,
    ]),
  ];
  const wsAmort = XLSX.utils.aoa_to_sheet(amortAOA);
  // Ajustar anchos de columnas y formato de moneda para columnas C-G
  (wsAmort as any)['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
  ];
  for (let r = 2; r <= result.amortizationTable.length + 1; r++) {
    ['C', 'D', 'E', 'F', 'G'].forEach((col) => {
      const addr = `${col}${r}`;
      if ((wsAmort as any)[addr]) (wsAmort as any)[addr].z = '"S/ "#,##0.00';
    });
  }
  XLSX.utils.book_append_sheet(wb, wsAmort, 'Amortizacion');

  XLSX.writeFile(wb, `simulacion_${Date.now()}.xlsx`);
}