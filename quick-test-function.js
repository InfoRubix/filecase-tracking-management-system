// Add this to your Google Apps Script for quick testing

function quickTest() {
  const SPREADSHEET_ID = '136JrEca6-aTarIfDCzko0cuvyT5tLIz5CrDctaKpXjY';
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('FILECASE');
  const data = sheet.getDataRange().getValues();
  
  console.log('=== QUICK TEST RESULTS ===');
  console.log('Total rows:', data.length);
  console.log('Headers:', data[0]);
  
  if (data.length > 1) {
    console.log('First data row:', data[1]);
    console.log('REF FILE (column 6):', data[1][6]);
    console.log('KOTAK (column 4):', data[1][4]);
    console.log('CLIENT NAME (column 7):', data[1][7]);
  }
  
  // Test search with first row data
  if (data.length > 1 && data[1][6]) {
    const testRefFile = data[1][6];
    console.log('Testing search for REF FILE:', testRefFile);
    const result = searchFile(testRefFile, 'refFile');
    console.log('Search result:', result);
  }
}