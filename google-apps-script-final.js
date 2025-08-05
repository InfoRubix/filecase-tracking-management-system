// Google Apps Script for File Case Management Database - FINAL FIXED
const SPREADSHEET_ID = '1uarWx23z4ehRcb7M9HuqpLHS3ncE8zCNPLTFpWJz1Jc';

let rackCache = null;
let rackCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 min cache

function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return createResponse(false, 'Missing action parameter');
  }

  const action = e.parameter.action;
  try {
    switch (action) {
      case 'searchFile': return searchFileOptimized(e.parameter.searchTerm, e.parameter.searchType);
      case 'getAllFiles': return getAllFiles();
      case 'getRackLookup': return getRackLookup();
      case 'getCategories': return getCategories();
      case 'getTypes': return getTypes();
      default: return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function doPost(e) {
  try {
    console.log('doPost received:', e.postData.contents);
    const postData = JSON.parse(e.postData.contents || '{}');
    const action = postData.action;
    console.log('Action:', action);

    switch (action) {
      case 'updateFile': return updateFile(postData);
      case 'createFile': return createFile(postData);
      case 'deleteFile': return deleteFile(postData);
      case 'createRack': return createRack(postData);
      case 'deleteRack': return deleteRack(postData);
      case 'addKotak': return addKotak(postData);
      case 'deleteKotak': return deleteKotak(postData);
      case 'createBox': return createBox(postData);
      case 'deleteBox': return deleteBox(postData);
      case 'getAvailableBoxes': return getAvailableBoxes();
      case 'addLog': return addLog(postData);
      case 'authenticate': return authenticateAdmin(postData.email, postData.password);
      case 'createCategory': return createCategory(postData);
      case 'createType': return createType(postData);
      default: return createResponse(false, 'Invalid action: ' + action);
    }
  } catch (error) {
    console.error('doPost error:', error);
    return createResponse(false, 'doPost error: ' + error.toString());
  }
}

// ===================== SEARCH =====================
function searchFileOptimized(searchTerm, searchType = 'auto') {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('FILECASE');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    if (data.length <= 1) return createResponse(false, 'No data found in FILECASE');

    const searchLower = searchTerm.toString().trim().toLowerCase();

    // Phase 1: Exact match REF FILE or BARCODE
    const exactMatch = findExactMatch(data, headers, searchLower);
    if (exactMatch) return exactMatch;

    // Phase 2: Client name (all files for that client)
    if (searchType === 'clientName' || searchType === 'auto') {
      const clientMatches = findClientMatches(data, headers, searchLower);
      if (clientMatches) return clientMatches;
    }

    // Phase 3: Partial match (fallback)
    const partialMatch = findPartialMatch(data, headers, searchLower, searchType);
    if (partialMatch) return partialMatch;

    return createResponse(false, {
      message: 'File not found',
      searchTerm,
      totalRecords: data.length - 1
    });
  } catch (error) {
    return createResponse(false, `Search error: ${error}`);
  }
}

function findExactMatch(data, headers, searchLower) {
  for (let i = 1; i < data.length; i++) {
    if (!data[i]) continue;

    // REF FILE (5)
    if (data[i][5] && data[i][5].toString().trim().toLowerCase() === searchLower) {
      return createResponse(true, { files: [buildFileObject(data[i], headers)], total: 1 });
    }

    // BARCODE NO (8)
    if (data[i][8] && data[i][8].toString().trim().toLowerCase() === searchLower) {
      return createResponse(true, { files: [buildFileObject(data[i], headers)], total: 1 });
    }
  }
  return null;
}

function findClientMatches(data, headers, searchLower) {
  let matchedClient = null;

  // Find client match
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] && data[i][6].toString().trim().toLowerCase().includes(searchLower)) {
      matchedClient = data[i][6].toString().trim();
      break;
    }
  }

  if (!matchedClient) return null;

  const clientFiles = [];
  const clientLower = matchedClient.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (data[i][6] && data[i][6].toString().trim().toLowerCase() === clientLower) {
      clientFiles.push(buildFileObject(data[i], headers));
    }
  }

  return createResponse(true, { files: clientFiles, total: clientFiles.length, clientName: matchedClient });
}

function findPartialMatch(data, headers, searchLower, searchType) {
  for (let i = 1; i < data.length; i++) {
    if (!data[i]) continue;

    // REF FILE (5)
    if ((searchType === 'refFile' || searchType === 'auto') && data[i][5] && data[i][5].toString().trim().toLowerCase().includes(searchLower)) {
      return createResponse(true, { files: [buildFileObject(data[i], headers)], total: 1 });
    }

    // BARCODE NO (8)
    if ((searchType === 'barcodeNo' || searchType === 'auto') && data[i][8] && data[i][8].toString().trim().toLowerCase().includes(searchLower)) {
      return createResponse(true, { files: [buildFileObject(data[i], headers)], total: 1 });
    }
  }
  return null;
}

// ===================== FILE & RACK =====================
function buildFileObject(row, headers) {
  const fileCase = {};
  headers.forEach((header, i) => {
    fileCase[header.toString().trim().toLowerCase().replace(/\s+/g, '')] = row[i];
  });

  fileCase.rack = getRackByCategoryCached(fileCase.kotak || '') || '';
  return fileCase;
}

function getRackByCategoryCached(kotak) {
  const now = Date.now();

  if (!rackCache || now - rackCacheTime > CACHE_DURATION) {
    const rackSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const rackData = rackSheet.getDataRange().getValues();
    const headers = rackData[0];

    const kotakIndex = headers.indexOf('KOTAK');
    const rackIndex = headers.indexOf('RACK');

    rackCache = {};
    for (let i = 1; i < rackData.length; i++) {
      if (rackData[i][kotakIndex]) {
        rackCache[rackData[i][kotakIndex].toString().toLowerCase()] = rackData[i][rackIndex];
      }
    }
    rackCacheTime = now;
  }

  return rackCache[kotak.toString().toLowerCase()] || null;
}

function getAllFiles() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('FILECASE');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const files = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].some(cell => cell)) files.push(buildFileObject(data[i], headers));
  }

  return createResponse(true, files);
}

function getRackLookup() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const racks = [];

  for (let i = 1; i < data.length; i++) {
    const rack = {};
    headers.forEach((header, index) => rack[header.toLowerCase().replace(/\s+/g, '')] = data[i][index]);
    racks.push(rack);
  }

  return createResponse(true, racks);
}

// ===================== UPDATE & LOG =====================
function updateFile(data) {
  try {
    console.log('Update file data received:', JSON.stringify(data));
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('FILECASE');
    const sheetData = sheet.getDataRange().getValues();
    const headers = sheetData[0];
    console.log('Sheet headers:', headers);

    // Find the row by ID (primary key)
    let targetRow = -1;
    const searchId = data.id;
    console.log('Looking for ID:', searchId);
    
    for (let i = 1; i < sheetData.length; i++) {
      console.log('Checking row', i, 'ID:', sheetData[i][0]);
      if (sheetData[i][0] && sheetData[i][0].toString() === searchId.toString()) { // ID (0) - use only ID for finding record
        targetRow = i;
        console.log('Found target row:', targetRow);
        break;
      }
    }
    
    if (targetRow === -1) {
      console.log('File not found with ID:', searchId);
      return createResponse(false, 'File not found with ID: ' + searchId);
    }

    // Update all fields based on column structure: ID, YEAR, CATEGORY, TYPE, KOTAK, REF FILE, CLIENT NAME, PHONE CLIENT, BARCODE NO, SAFEKEEPING, AGENT DETAILS, PIC, BANK, LOCATION
    const rowNumber = targetRow + 1;
    
    if (data.year !== undefined) sheet.getRange(rowNumber, 2).setValue(data.year); // YEAR (column 2)
    if (data.category !== undefined) sheet.getRange(rowNumber, 3).setValue(data.category); // CATEGORY (column 3)
    if (data.type !== undefined) sheet.getRange(rowNumber, 4).setValue(data.type); // TYPE (column 4)
    if (data.kotak !== undefined) sheet.getRange(rowNumber, 5).setValue(data.kotak); // KOTAK (column 5)
    if (data.reffile !== undefined) sheet.getRange(rowNumber, 6).setValue(data.reffile); // REF FILE (column 6)
    if (data.clientname !== undefined) sheet.getRange(rowNumber, 7).setValue(data.clientname); // CLIENT NAME (column 7)
    if (data.phoneClient !== undefined) sheet.getRange(rowNumber, 8).setValue(data.phoneClient); // PHONE CLIENT (column 8)
    if (data.barcodeno !== undefined) sheet.getRange(rowNumber, 9).setValue(data.barcodeno); // BARCODE NO (column 9)
    // Skip SAFEKEEPING (column 10) - cannot be edited
    if (data.agentdetails !== undefined) sheet.getRange(rowNumber, 11).setValue(data.agentdetails); // AGENT DETAILS (column 11)
    if (data.pic !== undefined) sheet.getRange(rowNumber, 12).setValue(data.pic); // PIC (column 12)
    if (data.bank !== undefined) sheet.getRange(rowNumber, 13).setValue(data.bank); // BANK (column 13)
    if (data.location !== undefined) {
      console.log('Updating location to:', data.location);
      sheet.getRange(rowNumber, 14).setValue(data.location); // LOCATION (column 14)
    }

    addLog({
      refFile: data.reffile || sheetData[targetRow][5], // Use new reffile if provided, otherwise use existing
      activity: data.activity || 'Updated',
      location: data.location || sheetData[targetRow][13], // LOCATION is at index 13 (column 14)
      updateBy: data.updateBy || 'System'
    });

    return createResponse(true, 'File updated successfully');
  } catch (error) {
    return createResponse(false, `Update file error: ${error.toString()}`);
  }
}

function createFile(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('FILECASE');
    const sheetData = sheet.getDataRange().getValues();
    const headers = sheetData[0];
    
    // Check if ref file already exists
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][5] === data.reffile) {
        return createResponse(false, 'File with this reference already exists');
      }
    }
    
    // Generate new unique ID by finding the highest existing ID
    let maxIdNumber = 0;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0]) {
        const idStr = sheetData[i][0].toString();
        if (idStr.startsWith('ID')) {
          const idNumber = parseInt(idStr.substring(2));
          if (!isNaN(idNumber) && idNumber > maxIdNumber) {
            maxIdNumber = idNumber;
          }
        }
      }
    }
    const nextId = `ID${maxIdNumber + 1}`;
    
    // Create row data based on column structure: ID, YEAR, CATEGORY, TYPE, KOTAK, REF FILE, CLIENT NAME, PHONE CLIENT, BARCODE NO, SAFEKEEPING, AGENT DETAILS, PIC, BANK, LOCATION
    const newRow = [
      nextId,                          // ID (0) - with ID prefix
      data.year || '',                 // YEAR (1)
      data.category || '',             // CATEGORY (2)
      data.type || '',                 // TYPE (3)
      data.kotak || '',                // KOTAK (4)
      data.reffile || '',              // REF FILE (5)
      data.clientname || '',           // CLIENT NAME (6)
      data.phoneClient || '',          // PHONE CLIENT (7)
      data.barcodeno || '',            // BARCODE NO (8)
      data.safekeeping || 'TRUE',      // SAFEKEEPING (9)
      data.agentdetails || '',         // AGENT DETAILS (10)
      data.pic || '',                  // PIC (11)
      data.bank || '',                 // BANK (12)
      data.location || 'Warehouse'     // LOCATION (13) - default to Warehouse
    ];
    
    sheet.appendRow(newRow);
    
    // Add log entry
    addLog({
      refFile: data.reffile,
      activity: 'File created',
      location: data.location || '',
      updateBy: data.createdBy || 'System'
    });
    
    return createResponse(true, 'File created successfully');
  } catch (error) {
    return createResponse(false, `Create file error: ${error.toString()}`);
  }
}

function deleteFile(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('FILECASE');
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][5] === data.refFile) { // REF FILE (5)
        // Add log before deleting
        addLog({
          refFile: data.refFile,
          activity: 'File deleted',
          location: sheetData[i][13] || '',
          updateBy: data.deletedBy || 'System'
        });
        
        sheet.deleteRow(i + 1);
        return createResponse(true, 'File deleted successfully');
      }
    }
    
    return createResponse(false, 'File not found');
  } catch (error) {
    return createResponse(false, `Delete file error: ${error.toString()}`);
  }
}

function addLog(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LOG');
  const now = new Date();
  const options = {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  const timestamp = new Intl.DateTimeFormat('en-GB', options).format(now).replace(',', '');
  console.log(timestamp); // Example: 31/07/2025 14:35

  const logData = sheet.getDataRange().getValues();
  const nextId = logData.length; // Auto ID

  sheet.appendRow([
    nextId,
    timestamp,
    data.refFile,
    data.activity,
    data.location,
    data.updateBy
  ]);

  return createResponse(true, 'Log added successfully');
}

// ===================== RACK MANAGEMENT =====================
function createRack(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const sheetData = sheet.getDataRange().getValues();
    
    // Check if rack already exists
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][2] && sheetData[i][2].toString().trim() === data.rack.toString().trim()) {
        return createResponse(false, 'Rack already exists');
      }
    }
    
    // Generate new ID by finding the highest existing IDK number
    let highestIdkNumber = 0;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0]) { // ID column
        const idStr = sheetData[i][0].toString();
        const match = idStr.match(/^IDK(\d+)$/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestIdkNumber) {
            highestIdkNumber = number;
          }
        }
      }
    }
    const nextIdkNumber = highestIdkNumber + 1;
    const nextId = `IDK${nextIdkNumber.toString().padStart(3, '0')}`;
    
    // Add initial rack entry (rack without kotak for now)
    // Structure: ID, KOTAK, RACK
    const newRow = [
      nextId,            // ID (0) - auto-generated sequential ID
      '',                // KOTAK (1) - empty for now
      data.rack          // RACK (2)
    ];
    
    sheet.appendRow(newRow);
    
    // Add log entry
    addLog({
      refFile: `RACK-${data.rack}`,
      activity: 'Rack created',
      location: 'System',
      updateBy: data.createdBy || 'System'
    });
    
    return createResponse(true, 'Rack created successfully');
  } catch (error) {
    return createResponse(false, `Create rack error: ${error.toString()}`);
  }
}

function deleteRack(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const sheetData = sheet.getDataRange().getValues();
    
    const rowsToDelete = [];
    
    // Find all rows with this rack
    for (let i = sheetData.length - 1; i >= 1; i--) {
      if (sheetData[i][2] && sheetData[i][2].toString().trim() === data.rack.toString().trim()) {
        rowsToDelete.push(i + 1); // +1 for 1-based row numbers
      }
    }
    
    if (rowsToDelete.length === 0) {
      return createResponse(false, 'Rack not found');
    }
    
    // Delete rows (from bottom to top to avoid index shifting)
    rowsToDelete.forEach(rowNum => {
      sheet.deleteRow(rowNum);
    });
    
    // Add log entry
    addLog({
      refFile: `RACK-${data.rack}`,
      activity: 'Rack deleted',
      location: 'System',
      updateBy: data.deletedBy || 'System'
    });
    
    return createResponse(true, 'Rack deleted successfully');
  } catch (error) {
    return createResponse(false, `Delete rack error: ${error.toString()}`);
  }
}

function addKotak(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const sheetData = sheet.getDataRange().getValues();
    
    // Generate new ID by finding the highest existing IDK number
    let highestIdkNumber = 0;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0]) { // ID column
        const idStr = sheetData[i][0].toString();
        const match = idStr.match(/^IDK(\d+)$/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestIdkNumber) {
            highestIdkNumber = number;
          }
        }
      }
    }
    const nextIdkNumber = highestIdkNumber + 1;
    const nextId = `IDK${nextIdkNumber.toString().padStart(3, '0')}`;
    
    // Add kotak entry
    // Structure: ID, KOTAK, RACK
    const newRow = [
      nextId,            // ID (0) - auto-generated sequential ID
      data.kotak,        // KOTAK (1) - user-provided kotak name
      data.rack          // RACK (2)
    ];
    
    sheet.appendRow(newRow);
    
    // Add log entry
    addLog({
      refFile: `RACK-${data.rack}-${data.kotak}`,
      activity: 'Kotak added',
      location: 'System',
      updateBy: data.createdBy || 'System'
    });
    
    return createResponse(true, 'Kotak added successfully');
  } catch (error) {
    return createResponse(false, `Add kotak error: ${error.toString()}`);
  }
}

function deleteKotak(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const sheetData = sheet.getDataRange().getValues();
    
    // Find the specific kotak in the specific rack
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][2] && sheetData[i][2].toString().trim() === data.rack.toString().trim() &&
          sheetData[i][1] && sheetData[i][1].toString().trim() === data.kotak.toString().trim()) {
        
        // Add log before deleting
        addLog({
          refFile: `RACK-${data.rack}-${data.kotak}`,
          activity: 'Kotak deleted',
          location: 'System',
          updateBy: data.deletedBy || 'System'
        });
        
        sheet.deleteRow(i + 1);
        return createResponse(true, 'Kotak deleted successfully');
      }
    }
    
    return createResponse(false, 'Kotak not found in specified rack');
  } catch (error) {
    return createResponse(false, `Delete kotak error: ${error.toString()}`);
  }
}

function deleteBox(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const sheetData = sheet.getDataRange().getValues();
    
    let deletedCount = 0;
    let rowsToDelete = [];
    
    // Find all entries with this kotak name (it might be in multiple racks)
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][1] && sheetData[i][1].toString().trim() === data.kotak.toString().trim()) {
        rowsToDelete.push(i + 1); // +1 because sheet rows are 1-indexed
        deletedCount++;
      }
    }
    
    if (deletedCount === 0) {
      return createResponse(false, 'Box not found in system');
    }
    
    // Add log before deleting
    addLog({
      refFile: `BOX-${data.kotak}`,
      activity: `Box permanently deleted from system (${deletedCount} entries removed)`,
      location: 'System',
      updateBy: data.deletedBy || 'System'
    });
    
    // Delete rows in reverse order to maintain row indices
    rowsToDelete.reverse();
    for (let rowIndex of rowsToDelete) {
      sheet.deleteRow(rowIndex);
    }
    
    return createResponse(true, `Box permanently deleted from system (${deletedCount} entries removed)`);
    
  } catch (error) {
    return createResponse(false, `Delete box error: ${error.toString()}`);
  }
}

function createBox(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const sheetData = sheet.getDataRange().getValues();
    
    // Check if box (kotak) already exists
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][1] && sheetData[i][1].toString().trim() === data.kotak.toString().trim()) {
        return createResponse(false, 'Box already exists');
      }
    }
    
    // Generate new ID by finding the highest existing IDK number
    let highestIdkNumber = 0;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0]) { // ID column
        const idStr = sheetData[i][0].toString();
        const match = idStr.match(/^IDK(\d+)$/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestIdkNumber) {
            highestIdkNumber = number;
          }
        }
      }
    }
    const nextIdkNumber = highestIdkNumber + 1;
    const nextId = `IDK${nextIdkNumber.toString().padStart(3, '0')}`;
    
    // Add standalone box entry (no rack assigned)
    // Structure: ID, KOTAK, RACK
    const newRow = [
      nextId,            // ID (0) - auto-generated sequential ID
      data.kotak,        // KOTAK (1) - user-provided kotak name
      ''                 // RACK (2) - empty for standalone box
    ];
    
    sheet.appendRow(newRow);
    
    // Add log entry
    addLog({
      refFile: `BOX-${data.kotak}`,
      activity: 'Box created',
      location: 'System',
      updateBy: data.createdBy || 'System'
    });
    
    return createResponse(true, 'Box created successfully');
  } catch (error) {
    return createResponse(false, `Create box error: ${error.toString()}`);
  }
}

function getAvailableBoxes() {
  try {
    const rackSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RACK_LOOKUP');
    const fileSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('FILECASE');
    
    const rackData = rackSheet.getDataRange().getValues();
    const fileData = fileSheet.getDataRange().getValues();
    
    // Get all boxes that are assigned to racks (have a rack value)
    const assignedBoxes = new Set();
    for (let i = 1; i < rackData.length; i++) {
      if (rackData[i][1] && rackData[i][2]) { // Has both KOTAK and RACK
        assignedBoxes.add(rackData[i][1].toString().trim());
      }
    }
    
    // Get standalone boxes (boxes in RACK_LOOKUP with empty rack)
    const standaloneBoxes = [];
    for (let i = 1; i < rackData.length; i++) {
      if (rackData[i][1] && (!rackData[i][2] || rackData[i][2].toString().trim() === '')) {
        const boxName = rackData[i][1].toString().trim();
        if (!assignedBoxes.has(boxName)) {
          standaloneBoxes.push(boxName);
        }
      }
    }
    
    // Get boxes from files that aren't assigned to racks
    const fileBoxes = [];
    for (let i = 1; i < fileData.length; i++) {
      if (fileData[i][4]) { // KOTAK column (index 4)
        const boxName = fileData[i][4].toString().trim();
        if (boxName && !assignedBoxes.has(boxName)) {
          fileBoxes.push(boxName);
        }
      }
    }
    
    // Combine and deduplicate
    const allAvailableBoxes = [...new Set([...standaloneBoxes, ...fileBoxes])];
    
    // Sort boxes using smart sorting
    allAvailableBoxes.sort((a, b) => {
      const getNumericValue = (str) => {
        // For IDK pattern (IDK001, IDK002, etc.)
        const idkMatch = str.match(/^IDK(\d+)$/);
        if (idkMatch) return parseInt(idkMatch[1]);
        
        // For numeric patterns (200A, 150B, etc.)
        const numMatch = str.match(/^(\d+)/);
        if (numMatch) return parseInt(numMatch[1]);
        
        // For pure numbers
        const pureNum = parseInt(str);
        if (!isNaN(pureNum)) return pureNum;
        
        return 0;
      };
      
      const aNum = getNumericValue(a);
      const bNum = getNumericValue(b);
      
      // Sort by numeric value descending (higher = more recent)
      if (aNum !== bNum) {
        return bNum - aNum;
      }
      
      // If numeric parts are same, sort alphabetically descending
      return b.localeCompare(a);
    });
    
    return createResponse(true, allAvailableBoxes);
  } catch (error) {
    return createResponse(false, `Get available boxes error: ${error.toString()}`);
  }
}

// ===================== CATEGORY & TYPE MANAGEMENT =====================
function getCategories() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('CATEGORY');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    if (data.length <= 1) {
      return createResponse(true, []); // Return empty array if no categories
    }
    
    const categories = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) { // Check if both ID and CATEGORY exist
        categories.push({
          id: data[i][0],
          category: data[i][1]
        });
      }
    }
    
    return createResponse(true, categories);
  } catch (error) {
    console.error('getCategories error:', error);
    return createResponse(false, `Get categories error: ${error.toString()}`);
  }
}

function getTypes() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TYPE');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    if (data.length <= 1) {
      return createResponse(true, []); // Return empty array if no types
    }
    
    const types = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) { // Check if both ID and TYPE exist
        types.push({
          id: data[i][0],
          type: data[i][1]
        });
      }
    }
    
    return createResponse(true, types);
  } catch (error) {
    console.error('getTypes error:', error);
    return createResponse(false, `Get types error: ${error.toString()}`);
  }
}

function createCategory(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('CATEGORY');
    const sheetData = sheet.getDataRange().getValues();
    
    // Check if category already exists (case-insensitive)
    const newCategoryLower = data.category.toString().trim().toLowerCase();
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][1] && sheetData[i][1].toString().trim().toLowerCase() === newCategoryLower) {
        return createResponse(false, 'Category already exists');
      }
    }
    
    // Generate new ID by finding the highest existing ID
    let maxId = 0;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0]) {
        const id = parseInt(sheetData[i][0]);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      }
    }
    const nextId = maxId + 1;
    
    // Add new category
    // Structure: ID, CATEGORY
    const newRow = [
      nextId,                    // ID (0) - auto-generated sequential ID
      data.category.trim()       // CATEGORY (1) - category name
    ];
    
    sheet.appendRow(newRow);
    
    // Add log entry
    addLog({
      refFile: `CATEGORY-${data.category}`,
      activity: 'Category created',
      location: 'System',
      updateBy: 'System'
    });
    
    return createResponse(true, 'Category created successfully');
  } catch (error) {
    console.error('createCategory error:', error);
    return createResponse(false, `Create category error: ${error.toString()}`);
  }
}

function createType(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TYPE');
    const sheetData = sheet.getDataRange().getValues();
    
    // Check if type already exists (case-insensitive)
    const newTypeLower = data.type.toString().trim().toLowerCase();
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][1] && sheetData[i][1].toString().trim().toLowerCase() === newTypeLower) {
        return createResponse(false, 'Type already exists');
      }
    }
    
    // Generate new ID by finding the highest existing ID
    let maxId = 0;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0]) {
        const id = parseInt(sheetData[i][0]);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      }
    }
    const nextId = maxId + 1;
    
    // Add new type
    // Structure: ID, TYPE
    const newRow = [
      nextId,                 // ID (0) - auto-generated sequential ID
      data.type.trim()        // TYPE (1) - type name
    ];
    
    sheet.appendRow(newRow);
    
    // Add log entry
    addLog({
      refFile: `TYPE-${data.type}`,
      activity: 'Type created',
      location: 'System',
      updateBy: 'System'
    });
    
    return createResponse(true, 'Type created successfully');
  } catch (error) {
    console.error('createType error:', error);
    return createResponse(false, `Create type error: ${error.toString()}`);
  }
}

// ===================== ADMIN =====================
function authenticateAdmin(email, password) {
  const ADMIN_EMAIL = 'admin@ahs.com';
  const ADMIN_PASSWORD = 'admin123';

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return createResponse(true, { authenticated: true, email });
  }
  return createResponse(false, 'Invalid credentials');
}

// ===================== RESPONSE =====================
function createResponse(success, data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success, data }))
    .setMimeType(ContentService.MimeType.JSON);
}
