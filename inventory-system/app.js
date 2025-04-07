// Global variables
let items = [];
let currentPage = 1;
const itemsPerPage = 10;
let totalItems = 0;
let totalStock = 0;

// DOM Elements
const itemTableBody = document.getElementById('itemTableBody');
const totalItemsElement = document.getElementById('totalItems');
const totalStockElement = document.getElementById('totalStock');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const searchInput = document.getElementById('searchInput');
const liveToast = document.getElementById('liveToast');
const toastBody = document.querySelector('.toast-body');
const loader = document.createElement('div');
loader.className = 'loader';
loader.innerHTML = `
  <div class="loader-content">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="mt-2">Loading data...</p>
  </div>
`;
document.body.appendChild(loader);

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Set up event listeners
  prevPageBtn.addEventListener('click', () => changePage(-1));
  nextPageBtn.addEventListener('click', () => changePage(1));
  searchInput.addEventListener('keyup', debounce(filterItems, 300));

  // Load initial data
  await loadItems();
  updateUI();
  setupChart();
});

// Load items from backend
async function loadItems() {
  showLoader();
  try {
    // In a real implementation, this would fetch from Google Apps Script
    // For now, we'll use mock data
    items = mockItems;
    totalItems = items.length;
    totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
    
    updateTotalStats();
    renderTable();
    setupPagination();
  } catch (error) {
    showToast('Error loading items: ' + error.message, 'danger');
  } finally {
    hideLoader();
  }
}

// Update UI with current data
function updateUI() {
  updateTotalStats();
  renderTable();
  setupPagination();
}

// Update dashboard statistics
function updateTotalStats() {
  totalItemsElement.textContent = totalItems;
  totalStockElement.textContent = totalStock;
}

// Render the items table
function renderTable() {
  itemTableBody.innerHTML = '';
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToShow = items.slice(startIndex, endIndex);

  itemsToShow.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.description || '-'}</td>
      <td>
        <span class="badge ${getWarehouseBadgeClass(item.warehouse)}">
          ${item.warehouse}
        </span>
      </td>
      <td>${item.quantity}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editItem(${item.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    itemTableBody.appendChild(row);
  });
}

// Get badge class based on warehouse
function getWarehouseBadgeClass(warehouse) {
  const classes = {
    'HO': 'bg-primary',
    'SK': 'bg-success',
    'SG': 'bg-info',
    'Project': 'bg-warning text-dark'
  };
  return classes[warehouse] || 'bg-secondary';
}

// Setup pagination controls
function setupPagination() {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  prevPageBtn.classList.toggle('disabled', currentPage === 1);
  nextPageBtn.classList.toggle('disabled', currentPage === totalPages);
}

// Change page
function changePage(direction) {
  const newPage = currentPage + direction;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  if (newPage > 0 && newPage <= totalPages) {
    currentPage = newPage;
    renderTable();
    setupPagination();
  }
}

// Filter items based on search input
function filterItems() {
  const searchTerm = searchInput.value.toLowerCase();
  
  if (searchTerm === '') {
    items = mockItems;
  } else {
    items = mockItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.warehouse.toLowerCase().includes(searchTerm)
    );
  }
  
  currentPage = 1;
  updateUI();
}

// Save new item
async function saveItem() {
  const form = document.getElementById('itemForm');
  const itemName = document.getElementById('itemName').value;
  const itemDescription = document.getElementById('itemDescription').value;
  const itemWarehouse = document.getElementById('itemWarehouse').value;
  const itemQuantity = document.getElementById('itemQuantity').value;

  if (!itemName || !itemQuantity) {
    showToast('Please fill in all required fields', 'warning');
    return;
  }

  showLoader();
  try {
    // In a real implementation, this would POST to Google Apps Script
    const newItem = {
      id: mockItems.length + 1,
      name: itemName,
      description: itemDescription,
      warehouse: itemWarehouse,
      quantity: parseInt(itemQuantity)
    };
    
    mockItems.push(newItem);
    showToast('Item added successfully!', 'success');
    
    // Reset form and close modal
    form.reset();
    bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
    
    // Refresh data
    await loadItems();
  } catch (error) {
    showToast('Error saving item: ' + error.message, 'danger');
  } finally {
    hideLoader();
  }
}

// Edit item
function editItem(id) {
  const item = mockItems.find(item => item.id === id);
  if (!item) return;

  // Populate form
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemDescription').value = item.description || '';
  document.getElementById('itemWarehouse').value = item.warehouse;
  document.getElementById('itemQuantity').value = item.quantity;

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
  modal.show();
}

// Delete item
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  showLoader();
  try {
    // In a real implementation, this would DELETE to Google Apps Script
    mockItems = mockItems.filter(item => item.id !== id);
    showToast('Item deleted successfully!', 'success');
    await loadItems();
  } catch (error) {
    showToast('Error deleting item: ' + error.message, 'danger');
  } finally {
    hideLoader();
  }
}

// Setup Chart.js
function setupChart() {
  const ctx = document.getElementById('stockChart').getContext('2d');
  
  // Calculate stock by warehouse
  const warehouseStock = {
    'HO': 0,
    'SK': 0,
    'SG': 0,
    'Project': 0
  };
  
  mockItems.forEach(item => {
    warehouseStock[item.warehouse] += item.quantity;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(warehouseStock),
      datasets: [{
        label: 'Stock Quantity',
        data: Object.values(warehouseStock),
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(26, 188, 156, 0.7)',
          'rgba(241, 196, 15, 0.7)'
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(26, 188, 156, 1)',
          'rgba(241, 196, 15, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = new bootstrap.Toast(liveToast);
  const toastHeader = liveToast.querySelector('.toast-header');
  
  // Remove all color classes
  toastHeader.classList.remove('bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info');
  
  // Add appropriate color class
  switch (type) {
    case 'success':
      toastHeader.classList.add('bg-success', 'text-white');
      break;
    case 'danger':
      toastHeader.classList.add('bg-danger', 'text-white');
      break;
    case 'warning':
      toastHeader.classList.add('bg-warning', 'text-dark');
      break;
    case 'info':
      toastHeader.classList.add('bg-info', 'text-white');
      break;
    default:
      toastHeader.classList.add('bg-primary', 'text-white');
  }
  
  toastBody.textContent = message;
  toast.show();
}

// Show loader
function showLoader() {
  loader.style.display = 'flex';
}

// Hide loader
function hideLoader() {
  loader.style.display = 'none';
}

// Debounce function for search
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// Mock data for demonstration
const mockItems = [
  { id: 1, name: 'Laptop', description: 'Dell XPS 15', warehouse: 'HO', quantity: 12 },
  { id: 2, name: 'Monitor', description: '27" 4K Display', warehouse: 'SK', quantity: 8 },
  { id: 3, name: 'Keyboard', description: 'Mechanical Keyboard', warehouse: 'SG', quantity: 15 },
  { id: 4, name: 'Mouse', description: 'Wireless Mouse', warehouse: 'Project', quantity: 20 },
  { id: 5, name: 'Docking Station', description: 'USB-C Dock', warehouse: 'HO', quantity: 5 },
  { id: 6, name: 'Headphones', description: 'Noise Cancelling', warehouse: 'SK', quantity: 10 },
  { id: 7, name: 'Webcam', description: 'HD Webcam', warehouse: 'SG', quantity: 7 },
  { id: 8, name: 'Microphone', description: 'USB Mic', warehouse: 'Project', quantity: 3 },
  { id: 9, name: 'Router', description: 'Wi-Fi 6 Router', warehouse: 'HO', quantity: 4 },
  { id: 10, name: 'Switch', description: 'Network Switch', warehouse: 'SK', quantity: 6 },
  { id: 11, name: 'Cables', description: 'HDMI Cables', warehouse: 'SG', quantity: 25 },
  { id: 12, name: 'Adapters', description: 'USB-C to HDMI', warehouse: 'Project', quantity: 18 }
];