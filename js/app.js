// Store items in localStorage
let items = JSON.parse(localStorage.getItem('items')) || [];

// DOM Elements
const itemList = document.getElementById('itemList');
const addItemBtn = document.getElementById('addItemBtn');
const addItemModal = document.getElementById('addItemModal');
const closeModal = document.getElementById('closeModal');
const addItemForm = document.getElementById('addItemForm');
const searchInput = document.getElementById('searchInput');
const editItemModal = document.getElementById('editItemModal');
const closeEditModal = document.getElementById('closeEditModal');
const editItemForm = document.getElementById('editItemForm');
const deleteItemBtn = document.getElementById('deleteItemBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// Event Listeners
addItemBtn.addEventListener('click', () => addItemModal.classList.replace('hidden', 'flex'));
closeModal.addEventListener('click', () => addItemModal.classList.replace('flex', 'hidden'));
addItemForm.addEventListener('submit', addItem);
searchInput.addEventListener('input', searchItems);
closeEditModal.addEventListener('click', () => editItemModal.classList.replace('flex', 'hidden'));
editItemForm.addEventListener('submit', editItem);
deleteItemBtn.addEventListener('click', () => deleteItem(editItemForm.dataset.itemId));
exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', importData);

// Functions
function addItem(e) {
    e.preventDefault();
    const newItem = {
        id: Date.now(),
        name: addItemForm.name.value,
        mrp: parseFloat(addItemForm.mrp.value),
        manufacturingDate: addItemForm.manufacturingDate.value || null,
        expiryDate: addItemForm.expiryDate.value || null,
        costPrice: addItemForm.costPrice.value ? parseFloat(addItemForm.costPrice.value) : null,
        quantity: parseInt(addItemForm.quantity.value)
    };
    items.push(newItem);
    saveItems();
    renderItems();
    addItemForm.reset();
    addItemModal.classList.replace('flex', 'hidden');
}

function renderItems(itemsToRender = items) {
    itemList.innerHTML = '';
    itemsToRender.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow';
        itemElement.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="font-bold text-xl text-gray-800">${item.name}</h3>
                <button class="editBtn text-blue-600 hover:text-blue-800" data-id="${item.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div class="space-y-2 text-gray-600">
                <p><span class="font-semibold">MRP:</span> ₹${item.mrp.toFixed(2)}</p>
                ${item.manufacturingDate ? `<p><span class="font-semibold">Mfg Date:</span> ${formatDate(item.manufacturingDate)}</p>` : ''}
                ${item.expiryDate ? `<p><span class="font-semibold">Exp Date:</span> ${formatDate(item.expiryDate)}</p>` : ''}
                ${item.costPrice ? `<p><span class="font-semibold">Cost:</span> ₹${item.costPrice.toFixed(2)}</p>` : ''}
                <p><span class="font-semibold">Quantity:</span> ${item.quantity}</p>
            </div>
        `;
        itemList.appendChild(itemElement);
    });
    
    document.querySelectorAll('.editBtn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
}

function searchItems() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    renderItems(filteredItems);
}

function openEditModal(itemId) {
    const item = items.find(i => i.id === Number(itemId)); // Use Number() instead of parseInt
    if (item) {
        editItemForm.dataset.itemId = itemId;
        editItemForm.name.value = item.name;
        editItemForm.mrp.value = item.mrp;
        editItemForm.manufacturingDate.value = item.manufacturingDate || '';
        editItemForm.expiryDate.value = item.expiryDate || '';
        editItemForm.costPrice.value = item.costPrice || '';
        editItemForm.quantity.value = item.quantity;
        editItemModal.classList.replace('hidden', 'flex');
    }
}

function editItem(e) {
    e.preventDefault();
    const itemId = Number(editItemForm.dataset.itemId); // Use Number() instead of parseInt
    const item = items.find(i => i.id === itemId);
    
    if (item) {
        item.name = editItemForm.name.value;
        item.mrp = parseFloat(editItemForm.mrp.value);
        item.manufacturingDate = editItemForm.manufacturingDate.value || null;
        item.expiryDate = editItemForm.expiryDate.value || null;
        item.costPrice = editItemForm.costPrice.value ? parseFloat(editItemForm.costPrice.value) : null;
        item.quantity = parseInt(editItemForm.quantity.value);
        
        saveItems();
        renderItems();
        editItemModal.classList.replace('flex', 'hidden');
    }
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        items = items.filter(i => i.id !== Number(itemId)); // Use Number() instead of parseInt
        saveItems();
        renderItems();
        editItemModal.classList.replace('flex', 'hidden');
    }
}

function saveItems() {
    localStorage.setItem('items', JSON.stringify(items));
}

function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

function exportData() {
    try {
        // Create a blob with the data
        const dataStr = JSON.stringify(items, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        link.download = `stock_data_${date}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Show success message
        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        showNotification('Failed to export data. Please try again.', 'error');
    }
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data structure
            if (!Array.isArray(importedData)) {
                throw new Error('Invalid data format');
            }
            
            // Validate each item has required fields
            importedData.forEach(item => {
                if (!item.name || typeof item.mrp !== 'number' || typeof item.quantity !== 'number') {
                    throw new Error('Invalid item data');
                }
            });

            // Merge imported data with existing data
            const newItems = importedData.map(item => ({
                ...item,
                id: item.id || Date.now() + Math.floor(Math.random() * 1000)
            }));

            items = [...items, ...newItems];
            saveItems();
            renderItems();
            
            showNotification(`Successfully imported ${newItems.length} items!`, 'success');
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Failed to import data. Please check the file format.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-y-0 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white`;
    
    // Add icon based on type
    const icon = type === 'success' ? '✓' : 
                type === 'error' ? '✕' : 
                'ℹ';
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <span>${icon}</span>
            <span>${message}</span>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + N to add new item
    if (e.altKey && e.key === 'n') {
        e.preventDefault();
        addItemBtn.click();
    }
    
    // Esc to close modals
    if (e.key === 'Escape') {
        addItemModal.classList.replace('flex', 'hidden');
        editItemModal.classList.replace('flex', 'hidden');
    }
    
    // Alt + S to focus search
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        searchInput.focus();
    }
});

// Initialize tooltips for keyboard shortcuts
function initTooltips() {
    addItemBtn.title = 'Add New Item (Alt + N)';
    searchInput.title = 'Search Items (Alt + S)';
}

// Add validation for dates
function validateDates() {
    const mfgDateInputs = document.querySelectorAll('[name="manufacturingDate"]');
    const expDateInputs = document.querySelectorAll('[name="expiryDate"]');
    
    mfgDateInputs.forEach(input => {
        input.addEventListener('change', function() {
            const expDate = this.form.querySelector('[name="expiryDate"]');
            if (expDate.value && this.value > expDate.value) {
                showNotification('Manufacturing date cannot be later than expiry date', 'error');
                this.value = '';
            }
        });
    });
    
    expDateInputs.forEach(input => {
        input.addEventListener('change', function() {
            const mfgDate = this.form.querySelector('[name="manufacturingDate"]');
            if (mfgDate.value && mfgDate.value > this.value) {
                showNotification('Expiry date cannot be earlier than manufacturing date', 'error');
                this.value = '';
            }
        });
    });
}

// Initialize the application
function init() {
    renderItems();
    initTooltips();
    validateDates();
}

// Start the application
init();