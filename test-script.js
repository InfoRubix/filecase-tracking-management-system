// Add this test function to your Google Apps Script to debug manually

function testSheetAccess() {
  try {
    const SPREADSHEET_ID = '136JrEca6-aTarIfDCzko0cuvyT5tLIz5CrDctaKpXjY';
    
    // Test 1: Can we access the spreadsheet?
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✅ Spreadsheet accessed successfully');
    
    // Test 2: What sheets exist?
    const sheets = spreadsheet.getSheets();
    console.log('📋 Available sheets:', sheets.map(s => s.getName()));
    
    // Test 3: Can we access FILECASE sheet?
    const filecaseSheet = spreadsheet.getSheetByName('FILECASE');
    if (!filecaseSheet) {
      console.log('❌ FILECASE sheet not found');
      return;
    }
    console.log('✅ FILECASE sheet found');
    
    // Test 4: Get headers
    const data = filecaseSheet.getDataRange().getValues();
    console.log('📊 Total rows:', data.length);
    console.log('📋 Headers:', data[0]);
    
    // Test 5: Get sample data
    if (data.length > 1) {
      console.log('📄 First data row:', data[1]);
    } else {
      console.log('⚠️ No data rows found (only headers)');
    }
    
    return {
      success: true,
      sheets: sheets.map(s => s.getName()),
      headers: data[0],
      totalRows: data.length,
      sampleRow: data.length > 1 ? data[1] : null
    };
    
  } catch (error) {
    console.log('❌ Error:', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Run this function manually in Google Apps Script editor