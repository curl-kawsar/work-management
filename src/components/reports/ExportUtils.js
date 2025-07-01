import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const exportToPDF = (reportData, reportType, filters) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Helper function to add text with word wrap
  const addText = (text, x, y, maxWidth = pageWidth - 40) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 7);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Work Management System - Reports', 20, yPosition);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition + 10);
  yPosition = addText(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 20, yPosition + 5);
  yPosition = addText(`Date Range: ${filters.startDate} to ${filters.endDate}`, 20, yPosition + 5);
  
  yPosition += 15;

  try {
    switch (reportType) {
      case 'overview':
        exportOverviewToPDF(doc, reportData, yPosition, addText, checkNewPage);
        break;
      case 'financial':
        exportFinancialToPDF(doc, reportData, yPosition, addText, checkNewPage);
        break;
      case 'staff-performance':
        exportStaffPerformanceToPDF(doc, reportData, yPosition, addText, checkNewPage);
        break;
      case 'work-orders':
        exportWorkOrdersToPDF(doc, reportData, yPosition, addText, checkNewPage);
        break;
    }

    // Save the PDF
    doc.save(`${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF report. Please try again.');
  }
};

const exportOverviewToPDF = (doc, data, startY, addText, checkNewPage) => {
  let yPosition = startY;
  const { overview, statusDistribution } = data;

  checkNewPage(60);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Overview Summary', 20, yPosition);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  yPosition += 10;

  const metrics = [
    `Total Work Orders: ${overview.totalWorkOrders}`,
    `Completed Work Orders: ${overview.completedWorkOrders}`,
    `Ongoing Work Orders: ${overview.ongoingWorkOrders}`,
    `Total Revenue: $${overview.totalRevenue.toLocaleString()}`,
    `Total Invoices: ${overview.totalInvoices}`,
    `Staff Count: ${overview.staffCount}`,
    `Completion Rate: ${overview.completionRate}%`
  ];

  metrics.forEach(metric => {
    checkNewPage();
    yPosition = addText(metric, 20, yPosition + 5);
  });

  // Status Distribution
  yPosition += 15;
  checkNewPage(40);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Status Distribution', 20, yPosition);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  statusDistribution.forEach(status => {
    checkNewPage();
    yPosition = addText(`${status.name}: ${status.value}`, 30, yPosition + 5);
  });
};

const exportFinancialToPDF = (doc, data, startY, addText, checkNewPage) => {
  let yPosition = startY;
  const { financial, topClients } = data;

  checkNewPage(80);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Financial Summary', 20, yPosition);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  yPosition += 10;

  const metrics = [
    `Total Revenue: $${financial.totalRevenue.toLocaleString()}`,
    `Total Client Payments: $${financial.totalClientPayments.toLocaleString()}`,
    `Total Expenses: $${financial.totalExpenses.toLocaleString()}`,
    `Material Costs: $${financial.totalMaterialCosts.toLocaleString()}`,
    `Labor Costs: $${financial.totalLaborCosts.toLocaleString()}`,
    `Utility Costs: $${financial.totalUtilityCosts.toLocaleString()}`,
    `Profit Margin: ${financial.profitMargin}%`,
    `Invoice Count: ${financial.invoiceCount}`
  ];

  metrics.forEach(metric => {
    checkNewPage();
    yPosition = addText(metric, 20, yPosition + 5);
  });

  // Top Clients
  if (topClients && topClients.length > 0) {
    yPosition += 15;
    checkNewPage(40);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    yPosition = addText('Top Clients by Revenue', 20, yPosition);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    topClients.slice(0, 10).forEach((client, index) => {
      checkNewPage();
      yPosition = addText(`${index + 1}. ${client.name}: $${client.revenue.toLocaleString()}`, 30, yPosition + 5);
    });
  }
};

const exportStaffPerformanceToPDF = (doc, data, startY, addText, checkNewPage) => {
  let yPosition = startY;
  const { staffPerformance } = data;

  checkNewPage(40);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Staff Performance Summary', 20, yPosition);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  yPosition += 10;

  staffPerformance.forEach((staff, index) => {
    checkNewPage(30);
    yPosition = addText(`${index + 1}. ${staff.name} (${staff.email})`, 20, yPosition + 5);
    yPosition = addText(`   Total Assigned: ${staff.totalAssigned}`, 30, yPosition + 5);
    yPosition = addText(`   Completed: ${staff.completed}`, 30, yPosition + 5);
    yPosition = addText(`   Completion Rate: ${staff.completionRate}%`, 30, yPosition + 5);
    yPosition = addText(`   Avg. Completion Time: ${staff.avgCompletionTime} days`, 30, yPosition + 5);
    yPosition += 5;
  });
};

const exportWorkOrdersToPDF = (doc, data, startY, addText, checkNewPage) => {
  let yPosition = startY;
  const { workOrders, workTypeDistribution, overdueWorkOrders } = data;

  checkNewPage(60);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Work Orders Summary', 20, yPosition);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  yPosition += 10;

  const metrics = [
    `Total Work Orders: ${workOrders.total}`,
    `Completed: ${workOrders.statusCounts.Completed}`,
    `Ongoing: ${workOrders.statusCounts.Ongoing}`,
    `Created: ${workOrders.statusCounts.Created}`,
    `Cancelled: ${workOrders.statusCounts.Cancelled}`,
    `Overdue: ${workOrders.overdue}`
  ];

  metrics.forEach(metric => {
    checkNewPage();
    yPosition = addText(metric, 20, yPosition + 5);
  });

  // Work Type Distribution
  if (workTypeDistribution && workTypeDistribution.length > 0) {
    yPosition += 15;
    checkNewPage(40);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    yPosition = addText('Work Type Distribution', 20, yPosition);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    workTypeDistribution.forEach(type => {
      checkNewPage();
      yPosition = addText(`${type.name}: ${type.value}`, 30, yPosition + 5);
    });
  }

  // Overdue Work Orders
  if (overdueWorkOrders && overdueWorkOrders.length > 0) {
    yPosition += 15;
    checkNewPage(40);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    yPosition = addText('Overdue Work Orders', 20, yPosition);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    overdueWorkOrders.forEach((wo, index) => {
      checkNewPage();
      yPosition = addText(`${index + 1}. ${wo.workOrderNumber} - ${wo.clientName}`, 30, yPosition + 5);
      yPosition = addText(`   Due: ${new Date(wo.dueDate).toLocaleDateString()}`, 35, yPosition + 5);
    });
  }
};

export const exportToExcel = (reportData, reportType, filters) => {
  try {
    const workbook = XLSX.utils.book_new();

    switch (reportType) {
      case 'overview':
        exportOverviewToExcel(workbook, reportData);
        break;
      case 'financial':
        exportFinancialToExcel(workbook, reportData);
        break;
      case 'staff-performance':
        exportStaffPerformanceToExcel(workbook, reportData);
        break;
      case 'work-orders':
        exportWorkOrdersToExcel(workbook, reportData);
        break;
    }

    // Add summary sheet
    const summaryData = [
      ['Report Type', reportType.charAt(0).toUpperCase() + reportType.slice(1)],
      ['Generated On', new Date().toLocaleDateString()],
      ['Date Range', `${filters.startDate} to ${filters.endDate}`],
      ['Staff Filter', filters.staffId === 'all' ? 'All Staff' : 'Filtered']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Save the Excel file
    XLSX.writeFile(workbook, `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    alert('Error generating Excel report. Please try again.');
  }
};

const exportOverviewToExcel = (workbook, data) => {
  const { overview, statusDistribution, monthlyTrends } = data;

  // Overview metrics sheet
  const overviewData = [
    ['Metric', 'Value'],
    ['Total Work Orders', overview.totalWorkOrders],
    ['Completed Work Orders', overview.completedWorkOrders],
    ['Ongoing Work Orders', overview.ongoingWorkOrders],
    ['Created Work Orders', overview.createdWorkOrders],
    ['Cancelled Work Orders', overview.cancelledWorkOrders],
    ['Total Revenue', overview.totalRevenue],
    ['Total Client Payments', overview.totalClientPayments],
    ['Total Expenses', overview.totalExpenses],
    ['Total Invoices', overview.totalInvoices],
    ['Staff Count', overview.staffCount],
    ['Completion Rate (%)', overview.completionRate]
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Status distribution sheet
  const statusData = [
    ['Status', 'Count'],
    ...statusDistribution.map(status => [status.name, status.value])
  ];

  const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
  XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status Distribution');

  // Monthly trends sheet
  if (monthlyTrends && monthlyTrends.length > 0) {
    const trendsData = [
      ['Month', 'Work Orders', 'Completed', 'Revenue'],
      ...monthlyTrends.map(trend => [trend.month, trend.workOrders, trend.completed, trend.revenue])
    ];

    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Monthly Trends');
  }
};

const exportFinancialToExcel = (workbook, data) => {
  const { financial, revenueByMonth, expenseBreakdown, topClients, recentInvoices } = data;

  // Financial metrics sheet
  const financialData = [
    ['Metric', 'Value'],
    ['Total Revenue', financial.totalRevenue],
    ['Total Client Payments', financial.totalClientPayments],
    ['Total Expenses', financial.totalExpenses],
    ['Material Costs', financial.totalMaterialCosts],
    ['Labor Costs', financial.totalLaborCosts],
    ['Utility Costs', financial.totalUtilityCosts],
    ['Profit Margin (%)', financial.profitMargin],
    ['Invoice Count', financial.invoiceCount]
  ];

  const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
  XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial Summary');

  // Revenue by month sheet
  if (revenueByMonth && revenueByMonth.length > 0) {
    const revenueData = [
      ['Month', 'Revenue', 'Expenses', 'Client Payments'],
      ...revenueByMonth.map(month => [month.month, month.revenue, month.expenses, month.clientPayments])
    ];

    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue by Month');
  }

  // Top clients sheet
  if (topClients && topClients.length > 0) {
    const clientsData = [
      ['Client Name', 'Revenue'],
      ...topClients.map(client => [client.name, client.revenue])
    ];

    const clientsSheet = XLSX.utils.aoa_to_sheet(clientsData);
    XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Top Clients');
  }

  // Recent invoices sheet
  if (recentInvoices && recentInvoices.length > 0) {
    const invoicesData = [
      ['Invoice Number', 'Work Order', 'Client', 'Revenue', 'Status', 'Issue Date'],
      ...recentInvoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.workOrder?.workOrderNumber || '',
        invoice.workOrder?.clientName || '',
        invoice.revenue,
        invoice.status,
        new Date(invoice.issueDate).toLocaleDateString()
      ])
    ];

    const invoicesSheet = XLSX.utils.aoa_to_sheet(invoicesData);
    XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Recent Invoices');
  }
};

const exportStaffPerformanceToExcel = (workbook, data) => {
  const { staffPerformance } = data;

  const staffData = [
    ['Staff Name', 'Email', 'Total Assigned', 'Completed', 'Ongoing', 'Completion Rate (%)', 'Avg Completion Time (days)'],
    ...staffPerformance.map(staff => [
      staff.name,
      staff.email,
      staff.totalAssigned,
      staff.completed,
      staff.ongoing,
      staff.completionRate,
      staff.avgCompletionTime
    ])
  ];

  const staffSheet = XLSX.utils.aoa_to_sheet(staffData);
  XLSX.utils.book_append_sheet(workbook, staffSheet, 'Staff Performance');
};

const exportWorkOrdersToExcel = (workbook, data) => {
  const { workOrders, workTypeDistribution, overdueWorkOrders, recentWorkOrders } = data;

  // Work orders summary sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Work Orders', workOrders.total],
    ['Completed', workOrders.statusCounts.Completed],
    ['Ongoing', workOrders.statusCounts.Ongoing],
    ['Created', workOrders.statusCounts.Created],
    ['Cancelled', workOrders.statusCounts.Cancelled],
    ['Overdue', workOrders.overdue]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Work Orders Summary');

  // Work type distribution sheet
  if (workTypeDistribution && workTypeDistribution.length > 0) {
    const typeData = [
      ['Work Type', 'Count'],
      ...workTypeDistribution.map(type => [type.name, type.value])
    ];

    const typeSheet = XLSX.utils.aoa_to_sheet(typeData);
    XLSX.utils.book_append_sheet(workbook, typeSheet, 'Work Type Distribution');
  }

  // Overdue work orders sheet
  if (overdueWorkOrders && overdueWorkOrders.length > 0) {
    const overdueData = [
      ['Work Order Number', 'Client Name', 'Due Date', 'Status', 'Assigned Staff'],
      ...overdueWorkOrders.map(wo => [
        wo.workOrderNumber,
        wo.clientName,
        new Date(wo.dueDate).toLocaleDateString(),
        wo.status,
        wo.assignedStaff?.name || 'Unassigned'
      ])
    ];

    const overdueSheet = XLSX.utils.aoa_to_sheet(overdueData);
    XLSX.utils.book_append_sheet(workbook, overdueSheet, 'Overdue Work Orders');
  }

  // Recent work orders sheet
  if (recentWorkOrders && recentWorkOrders.length > 0) {
    const recentData = [
      ['Work Order Number', 'Client Name', 'Status', 'Created Date', 'Assigned Staff'],
      ...recentWorkOrders.map(wo => [
        wo.workOrderNumber,
        wo.clientName,
        wo.status,
        new Date(wo.createdAt).toLocaleDateString(),
        wo.assignedStaff?.name || 'Unassigned'
      ])
    ];

    const recentSheet = XLSX.utils.aoa_to_sheet(recentData);
    XLSX.utils.book_append_sheet(workbook, recentSheet, 'Recent Work Orders');
  }
};
