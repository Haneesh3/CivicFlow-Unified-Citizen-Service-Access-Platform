import * as ExcelJS from 'exceljs';
import * as path from 'path';

export interface TestResult {
  name: string;
  module: 'Web' | 'Mobile';
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  errorMessage?: string;
  timestamp: string;
}

export async function generateExcelReport(results: TestResult[], outputFilename = 'test_report.xlsx') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('E2E Test Results');

  // Title Row
  sheet.mergeCells('A1:F1');
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = 'CivicFlow Unified Platform E2E Test Report';
  titleRow.getCell(1).font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '050A44' }, // CivicFlow Dark Blue Theme
  };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 40;

  // Metadata block
  sheet.getCell('A3').value = 'Report Date:';
  sheet.getCell('A3').font = { bold: true };
  sheet.getCell('B3').value = new Date().toLocaleString();

  const totalTests = results.length;
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = totalTests - passed;

  sheet.getCell('D3').value = 'Total Tests:';
  sheet.getCell('D3').font = { bold: true };
  sheet.getCell('E3').value = totalTests;

  sheet.getCell('D4').value = 'Passed:';
  sheet.getCell('D4').font = { bold: true, color: { argb: '10B981' } };
  sheet.getCell('E4').value = passed;

  sheet.getCell('D5').value = 'Failed:';
  sheet.getCell('D5').font = { bold: true, color: { argb: 'EF4444' } };
  sheet.getCell('E5').value = failed;

  // Empty row before table
  sheet.addRow([]);

  // Headers
  const headerRow = sheet.addRow([
    'Test Name',
    'Platform/Module',
    'Status',
    'Execution Time (ms)',
    'Timestamp',
    'Error Details',
  ]);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0A1A7F' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Data Rows
  results.forEach((res) => {
    const row = sheet.addRow([
      res.name,
      res.module,
      res.status,
      res.durationMs,
      res.timestamp,
      res.errorMessage || 'N/A',
    ]);
    row.height = 20;

    // Center platform, status, time, timestamp
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(5).alignment = { horizontal: 'center' };

    // Format status cell
    const statusCell = row.getCell(3);
    if (res.status === 'PASSED') {
      statusCell.font = { bold: true, color: { argb: '065F46' } }; // Dark Green text
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D1FAE5' }, // Soft Green bg
      };
    } else {
      statusCell.font = { bold: true, color: { argb: '991B1B' } }; // Dark Red text
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FEE2E2' }, // Soft Red bg
      };
    }
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell && column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.max(maxLength + 3, 15);
  });

  const outputPath = path.join(process.cwd(), outputFilename);
  await workbook.xlsx.writeFile(outputPath);
  console.log(`📊 Excel Report generated successfully at: ${outputPath}`);
}
