// Get data from localStorage
let items = JSON.parse(localStorage.getItem('items')) || [];
let salesData = JSON.parse(localStorage.getItem('salesData')) || [];

// DOM Elements
const todaySalesElement = document.getElementById('todaySales');
const totalSalesElement = document.getElementById('totalSales');
const totalPurchaseElement = document.getElementById('totalPurchase');
const overallProfitElement = document.getElementById('overallProfit');
const expiringItemsContainer = document.getElementById('expiringItems');
const recentSalesContainer = document.getElementById('recentSales');

// Initialize dashboard
function initDashboard() {
    updateSalesStats();
    showExpiringItems();
    showRecentSales();
}

// Update sales statistics
function updateSalesStats() {
    const today = new Date().toLocaleDateString();
    
    // Calculate today's sales
    const todaySales = salesData
        .filter(sale => new Date(sale.date).toLocaleDateString() === today)
        .reduce((total, sale) => total + sale.grandTotal, 0);
    
    // Calculate total sales
    const totalSales = salesData.reduce((total, sale) => total + sale.grandTotal, 0);
    
    // Calculate total purchase
    const totalPurchase = items.reduce((total, item) => {
        return total + (item.costPrice || 0) * item.quantity;
    }, 0);
    
    // Calculate overall profit
    const totalCost = salesData.reduce((total, sale) => {
        return total + sale.items.reduce((itemTotal, item) => {
            const stockItem = items.find(i => i.id === item.id);
            return itemTotal + (stockItem?.costPrice || 0) * item.quantity;
        }, 0);
    }, 0);
    
    const overallProfit = totalSales - totalCost;
    
    // Update DOM
    todaySalesElement.textContent = `₹${todaySales.toFixed(2)}`;
    totalSalesElement.textContent = `₹${totalSales.toFixed(2)}`;
    totalPurchaseElement.textContent = `₹${totalPurchase.toFixed(2)}`;
    overallProfitElement.textContent = `₹${overallProfit.toFixed(2)}`;
}

// Show items expiring in the next month
function showExpiringItems() {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    const expiringItems = items
        .filter(item => {
            if (!item.expiryDate) return false;
            const expiryDate = new Date(item.expiryDate);
            return expiryDate <= oneMonthFromNow && expiryDate >= new Date();
        })
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    
    expiringItemsContainer.innerHTML = expiringItems
        .map(item => {
            const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            const rowClass = daysLeft <= 7 ? 'bg-red-50' : '';
            
            return `
                <tr class="${rowClass}">
                    <td class="px-6 py-4 whitespace-nowrap">${item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${formatDate(item.expiryDate)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${item.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="${daysLeft <= 7 ? 'text-red-600 font-semibold' : ''}">${daysLeft} days</span>
                    </td>
                </tr>
            `;
        })
        .join('');
}

// Show recent sales
function showRecentSales() {
    const recentSales = [...salesData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recentSalesContainer.innerHTML = recentSales
        .map(sale => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${sale.billNo}</td>
                <td class="px-6 py-4 whitespace-nowrap">${formatDate(sale.date)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${sale.items.length} items</td>
                <td class="px-6 py-4 whitespace-nowrap">₹${sale.grandTotal.toFixed(2)}</td>
            </tr>
        `)
        .join('');
}

// Helper function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Data management functions
function exportData() {
    const data = {
        items: JSON.parse(localStorage.getItem('items')) || [],
        salesData: JSON.parse(localStorage.getItem('salesData')) || []
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trishul-erp-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!Array.isArray(data.items) || !Array.isArray(data.salesData)) {
                throw new Error('Invalid data format');
            }
            
            // Store the data
            localStorage.setItem('items', JSON.stringify(data.items));
            localStorage.setItem('salesData', JSON.stringify(data.salesData));
            
            // Refresh dashboard
            initDashboard();
            
            // Show success message
            showNotification('Data imported successfully!', 'success');
        } catch (error) {
            showNotification('Error importing data. Please check the file format.', 'error');
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        localStorage.removeItem('items');
        localStorage.removeItem('salesData');
        items = [];
        salesData = [];
        initDashboard();
        showNotification('All data has been reset.', 'success');
    }
}

// Notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } shadow-lg z-50 transition-opacity duration-500`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// File input handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        importData(file);
    }
}

// Initialize dashboard
initDashboard();

// Update dashboard every minute
setInterval(initDashboard, 60000);
