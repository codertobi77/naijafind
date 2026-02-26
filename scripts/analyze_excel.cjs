// Script to analyze the Excel file structure
const XLSX = require('xlsx');
const fs = require('fs');

const filePath = './Hotels Lagos.xlsx';

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);

console.log('=== Workbook Info ===');
console.log('Sheet names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`\n=== Sheet: ${sheetName} ===`);
  console.log('Total rows:', jsonData.length);
  
  if (jsonData.length > 0) {
    const headers = jsonData[0];
    console.log('\nHeaders:');
    headers.forEach((header, index) => {
      console.log(`  [${index}] "${header}"`);
    });
    
    // Show first 3 data rows
    console.log('\nFirst 3 data rows:');
    for (let i = 1; i <= Math.min(3, jsonData.length - 1); i++) {
      const row = jsonData[i];
      console.log(`\n  Row ${i}:`);
      headers.forEach((header, index) => {
        const value = row[index];
        if (value !== undefined && value !== '') {
          console.log(`    ${header}: "${value}"`);
        }
      });
    }
  }
});
