function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

// Handle CRUD operations
function handleRequest(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Items');
  const data = JSON.parse(e.postData.contents);

  switch (e.parameter.action) {
    case 'getItems':
      return getItems(sheet);
    case 'addItem':
      return addItem(sheet, data);
    case 'updateItem':
      return updateItem(sheet, data);
    case 'deleteItem':
      return deleteItem(sheet, data.id);
    default:
      return { success: false, message: 'Invalid action' };
  }
}

// Get all items
function getItems(sheet) {
  const rows = sheet.getDataRange().getValues();
  const items = rows.slice(1).map(row => ({
    id: row[0],
    name: row[1],
    description: row[2],
    warehouse: row[3],
    quantity: row[4]
  }));
  return ContentService.createTextOutput(JSON.stringify(items)).setMimeType(ContentService.MimeType.JSON);
}

// Add item
function addItem(sheet, data) {
  const lastRow = sheet.getLastRow() + 1;
  const timestamp = new Date();
  sheet.getRange(lastRow, 1, 1, 6).setValues([[lastRow - 1, data.name, data.description, data.warehouse, data.quantity, timestamp]]);
  return { success: true };
}

// Update item
function updateItem(sheet, data) {
  const rows = sheet.getDataRange().getValues();
  const rowIndex = rows.findIndex(row => row[0] === data.id);
  
  if (rowIndex === -1) {
    return { success: false, message: 'Item not found' };
  }

  sheet.getRange(rowIndex + 1, 2, 1, 4).setValues([[data.name, data.description, data.warehouse, data.quantity]]);
  return { success: true };
}

// Delete item
function deleteItem(sheet, id) {
  const rows = sheet.getDataRange().getValues();
  const rowIndex = rows.findIndex(row => row[0] === id);
  
  if (rowIndex === -1) {
    return { success: false, message: 'Item not found' };
  }

  sheet.deleteRow(rowIndex + 1);
  return { success: true };
}