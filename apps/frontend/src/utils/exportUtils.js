import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Export sprint report as PDF
export const exportToPDF = async (reportData, elementId = 'sprint-report-content') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Report content element not found');
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add header
    pdf.setFontSize(20);
    pdf.text('Sprint Report', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Sprint: ${reportData.sprintName}`, 20, 30);
    pdf.text(`Period: ${new Date(reportData.startDate).toLocaleDateString()} - ${new Date(reportData.endDate).toLocaleDateString()}`, 20, 35);

    // Save PDF
    const fileName = `sprint-report-${reportData.sprintName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

// Export sprint report data as CSV
export const exportToCSV = (reportData) => {
  try {
    const csvData = [];
    
    // Add header
    csvData.push([
      'Sprint Report',
      reportData.sprintName,
      new Date(reportData.startDate).toLocaleDateString(),
      new Date(reportData.endDate).toLocaleDateString()
    ]);
    csvData.push([]);
    
    // Add summary data
    csvData.push(['Metric', 'Value']);
    csvData.push(['Total Issues', reportData.totalIssues]);
    csvData.push(['Completed Issues', reportData.completedIssues]);
    csvData.push(['In Progress Issues', reportData.inProgressIssues]);
    csvData.push(['Not Started Issues', reportData.notStartedIssues]);
    csvData.push(['Total Story Points', reportData.totalStoryPoints]);
    csvData.push(['Completed Story Points', reportData.completedStoryPoints]);
    csvData.push(['Velocity', reportData.velocity]);
    csvData.push(['Total Estimated Hours', reportData.totalEstimatedHours]);
    csvData.push(['Total Actual Hours', reportData.totalActualHours]);
    csvData.push(['Effort Variance', reportData.effortVariance]);
    csvData.push(['Completion Rate', `${reportData.sprintHealth?.completionRate?.toFixed(1) || 0}%`]);
    csvData.push(['Effort Accuracy', `${reportData.sprintHealth?.effortAccuracy?.toFixed(1) || 0}%`]);
    csvData.push([]);
    
    // Add team members data
    if (reportData.teamMembers && reportData.teamMembers.length > 0) {
      csvData.push(['Team Performance']);
      csvData.push(['Member', 'Issues Assigned', 'Issues Completed', 'Story Points Completed', 'Hours Spent']);
      reportData.teamMembers.forEach(member => {
        csvData.push([
          member.member?.name || 'Unknown',
          member.issuesAssigned,
          member.issuesCompleted,
          member.storyPointsCompleted,
          member.hoursSpent
        ]);
      });
      csvData.push([]);
    }
    
    // Add issue type breakdown
    if (reportData.issueTypeBreakdown && reportData.issueTypeBreakdown.length > 0) {
      csvData.push(['Issue Type Breakdown']);
      csvData.push(['Issue Type', 'Total', 'Completed', 'Story Points', 'Completed Story Points']);
      reportData.issueTypeBreakdown.forEach(breakdown => {
        csvData.push([
          breakdown.issueType,
          breakdown.total,
          breakdown.completed,
          breakdown.storyPoints,
          breakdown.completedStoryPoints
        ]);
      });
      csvData.push([]);
    }
    
    // Add status breakdown
    if (reportData.statusBreakdown && reportData.statusBreakdown.length > 0) {
      csvData.push(['Status Breakdown']);
      csvData.push(['Status', 'Count', 'Story Points']);
      reportData.statusBreakdown.forEach(status => {
        csvData.push([
          status.status,
          status.count,
          status.storyPoints
        ]);
      });
    }
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const fileName = `sprint-report-${reportData.sprintName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
};

// Export sprint report data as Excel
export const exportToExcel = async (reportData) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Add summary data
    summarySheet.addRow(['Sprint Report Summary']);
    summarySheet.addRow(['Sprint Name', reportData.sprintName]);
    summarySheet.addRow(['Start Date', new Date(reportData.startDate).toLocaleDateString()]);
    summarySheet.addRow(['End Date', new Date(reportData.endDate).toLocaleDateString()]);
    summarySheet.addRow(['Generated At', new Date(reportData.generatedAt).toLocaleString()]);
    summarySheet.addRow([]);
    
    summarySheet.addRow(['Key Metrics']);
    summarySheet.addRow(['Total Issues', reportData.totalIssues]);
    summarySheet.addRow(['Completed Issues', reportData.completedIssues]);
    summarySheet.addRow(['In Progress Issues', reportData.inProgressIssues]);
    summarySheet.addRow(['Not Started Issues', reportData.notStartedIssues]);
    summarySheet.addRow(['Total Story Points', reportData.totalStoryPoints]);
    summarySheet.addRow(['Completed Story Points', reportData.completedStoryPoints]);
    summarySheet.addRow(['Velocity', reportData.velocity]);
    summarySheet.addRow(['Total Estimated Hours', reportData.totalEstimatedHours]);
    summarySheet.addRow(['Total Actual Hours', reportData.totalActualHours]);
    summarySheet.addRow(['Effort Variance', reportData.effortVariance]);
    summarySheet.addRow(['Completion Rate', `${reportData.sprintHealth?.completionRate?.toFixed(1) || 0}%`]);
    summarySheet.addRow(['Effort Accuracy', `${reportData.sprintHealth?.effortAccuracy?.toFixed(1) || 0}%`]);
    
    // Team performance sheet
    if (reportData.teamMembers && reportData.teamMembers.length > 0) {
      const teamSheet = workbook.addWorksheet('Team Performance');
      teamSheet.addRow(['Team Performance']);
      teamSheet.addRow(['Member', 'Issues Assigned', 'Issues Completed', 'Story Points Completed', 'Hours Spent']);
      
      reportData.teamMembers.forEach(member => {
        teamSheet.addRow([
          member.member?.name || 'Unknown',
          member.issuesAssigned,
          member.issuesCompleted,
          member.storyPointsCompleted,
          member.hoursSpent
        ]);
      });
    }
    
    // Issue type breakdown sheet
    if (reportData.issueTypeBreakdown && reportData.issueTypeBreakdown.length > 0) {
      const issueTypeSheet = workbook.addWorksheet('Issue Types');
      issueTypeSheet.addRow(['Issue Type Breakdown']);
      issueTypeSheet.addRow(['Issue Type', 'Total', 'Completed', 'Story Points', 'Completed Story Points']);
      
      reportData.issueTypeBreakdown.forEach(breakdown => {
        issueTypeSheet.addRow([
          breakdown.issueType,
          breakdown.total,
          breakdown.completed,
          breakdown.storyPoints,
          breakdown.completedStoryPoints
        ]);
      });
    }
    
    // Status breakdown sheet
    if (reportData.statusBreakdown && reportData.statusBreakdown.length > 0) {
      const statusSheet = workbook.addWorksheet('Status Breakdown');
      statusSheet.addRow(['Status Breakdown']);
      statusSheet.addRow(['Status', 'Count', 'Story Points']);
      
      reportData.statusBreakdown.forEach(status => {
        statusSheet.addRow([
          status.status,
          status.count,
          status.storyPoints
        ]);
      });
    }
    
    // Save Excel file
    const fileName = `sprint-report-${reportData.sprintName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

// Print sprint report
export const printReport = (elementId = 'sprint-report-content') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Report content element not found');
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sprint Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    return { success: true };
  } catch (error) {
    console.error('Error printing report:', error);
    return { success: false, error: error.message };
  }
};
