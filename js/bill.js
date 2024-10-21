// Store items in localStorage
let items = JSON.parse(localStorage.getItem('items')) || [];
let billItems = [];

// DOM Elements
const itemList = document.getElementById('itemList');
const searchInput = document.getElementById('searchInput');
const togglePageBtn = document.getElementById('togglePage');
const itemsPage = document.getElementById('itemsPage');
const billPage = document.getElementById('billPage');
const billItemsContainer = document.getElementById('billItems');
const billTotalElement = document.getElementById('billTotal');
const saveBillBtn = document.getElementById('saveBillBtn');
const itemInfoModal = document.getElementById('itemInfoModal');
const itemNameElement = document.getElementById('itemName');
const itemDetailsElement = document.getElementById('itemDetails');
const sellForm = document.getElementById('sellForm');
const closeItemInfoModal = document.getElementById('closeItemInfoModal');
const saveBillModal = document.getElementById('saveBillModal');
const saveBillForm = document.getElementById('saveBillForm');
const closeSaveBillModal = document.getElementById('closeSaveBillModal');
const billPreviewModal = document.getElementById('billPreviewModal');
const billPreviewContent = document.getElementById('billPreviewContent');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const closeBillPreviewModal = document.getElementById('closeBillPreviewModal');

// Event Listeners
togglePageBtn.addEventListener('click', togglePage);
searchInput.addEventListener('input', searchItems);
saveBillBtn.addEventListener('click', () => toggleModal(saveBillModal, true));
closeItemInfoModal.addEventListener('click', () => toggleModal(itemInfoModal, false));
closeSaveBillModal.addEventListener('click', () => toggleModal(saveBillModal, false));
closeBillPreviewModal.addEventListener('click', () => toggleModal(billPreviewModal, false));
sellForm.addEventListener('submit', addToBill);
saveBillForm.addEventListener('submit', saveAndGenerateBill);
downloadPdfBtn.addEventListener('click', downloadBillPdf);

// Functions
function renderItems(itemsToRender = items) {
    itemList.innerHTML = '';
    itemsToRender.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-white p-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer';
        itemElement.innerHTML = `
            <h3 class="font-bold text-xl mb-2 text-indigo-600">${item.name}</h3>
            <p class="mb-1"><span class="font-semibold text-gray-600">MRP:</span> ₹${item.mrp.toFixed(2)}</p>
            <p class="mb-1"><span class="font-semibold text-gray-600">Quantity:</span> ${item.quantity}</p>
        `;
        itemElement.addEventListener('click', () => openItemInfoModal(item));
        itemList.appendChild(itemElement);
    });
}

function searchItems() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    renderItems(filteredItems);
}

function togglePage() {
    itemsPage.classList.toggle('active');
    billPage.classList.toggle('active');
    togglePageBtn.innerHTML = itemsPage.classList.contains('active') 
        ? '<i class="fas fa-file-invoice mr-2"></i>View Bill' 
        : '<i class="fas fa-box mr-2"></i>View Items';
}

function toggleModal(modal, show) {
    modal.classList.toggle('hidden', !show);
    modal.classList.toggle('flex', show);
    setTimeout(() => {
        modal.querySelector('.modal-content').style.opacity = show ? '1' : '0';
        modal.querySelector('.modal-content').style.transform = show ? 'scale(1)' : 'scale(0.95)';
    }, 10);
}

function openItemInfoModal(item) {
    itemNameElement.textContent = item.name;
    itemDetailsElement.innerHTML = `
        <p><strong>MRP:</strong> ₹${item.mrp.toFixed(2)}</p>
        <p><strong>Manufacturing Date:</strong> ${formatDate(item.manufacturingDate)}</p>
        <p><strong>Expiry Date:</strong> ${formatDate(item.expiryDate)}</p>
        <p><strong>Cost Price:</strong> ₹${item.costPrice ? item.costPrice.toFixed(2) : 'N/A'}</p>
        <p><strong>Available Quantity:</strong> ${item.quantity}</p>
    `;
    sellForm.dataset.itemId = item.id;
    toggleModal(itemInfoModal, true);
}

function addToBill(e) {
    e.preventDefault();
    const itemId = Number(sellForm.dataset.itemId);
    const item = items.find(i => i.id === itemId);
    const quantity = parseInt(sellForm.sellQuantity.value);
    const discountPercent = parseFloat(sellForm.discountPercent.value) || 0;
    const additionalFee = parseFloat(sellForm.additionalFee.value) || 0;

    if (item && quantity > 0 && quantity <= item.quantity) {
        const totalPrice = (item.mrp * quantity * (1 - discountPercent / 100)) + additionalFee;
        const billItem = {
            id: itemId,
            name: item.name,
            quantity: quantity,
            price: item.mrp,
            discountPercent: discountPercent,
            additionalFee: additionalFee,
            totalPrice: totalPrice
        };
        billItems.push(billItem);
        item.quantity -= quantity;
        updateBillSummary();
        saveItems();
        toggleModal(itemInfoModal, false);
        sellForm.reset();
    } else {
        showNotification('Invalid quantity or not enough stock!', 'error');
    }
}

function updateBillSummary() {
    billItemsContainer.innerHTML = '';
    let total = 0;
    billItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex justify-between items-center py-2 border-b';
        itemElement.innerHTML = `
            <span class="font-medium">${item.name} (x${item.quantity})</span>
            <span class="text-indigo-600 font-bold">₹${item.totalPrice.toFixed(2)}</span>
        `;
        billItemsContainer.appendChild(itemElement);
        total += item.totalPrice;
    });
    billTotalElement.textContent = total.toFixed(2);
}

function saveAndGenerateBill(e) {
    e.preventDefault();
    if (billItems.length === 0) {
        showNotification('Please add items to the bill before saving.', 'error');
        return;
    }
    const gstPercent = parseFloat(saveBillForm.gstPercent.value) || 0;
    const subtotal = parseFloat(billTotalElement.textContent);
    const gstAmount = subtotal * (gstPercent / 100);
    const grandTotal = subtotal + gstAmount;

    // Create sales record
    const salesRecord = {
        billNo: Date.now().toString(),
        date: new Date().toISOString(),
        items: billItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            discountPercent: item.discountPercent,
            additionalFee: item.additionalFee,
            totalPrice: item.totalPrice
        })),
        subtotal: subtotal,
        gstPercent: gstPercent,
        gstAmount: gstAmount,
        grandTotal: grandTotal
    };

    // Save to localStorage
    let salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    salesData.push(salesRecord);
    localStorage.setItem('salesData', JSON.stringify(salesData));

    // Continue with the existing bill generation code...
    const billContent = `
        <div class="space-y-4">
            <h3 class="text-xl font-bold text-indigo-600 mb-4">Bill Details</h3>
            ${billItems.map(item => `
                <div class="flex justify-between py-2 border-b">
                    <span>${item.name} (x${item.quantity})</span>
                    <span class="font-medium">₹${item.totalPrice.toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="pt-4 space-y-2">
                <div class="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                    <span>GST (${gstPercent}%):</span>
                    <span>₹${gstAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between font-bold text-lg text-indigo-600 pt-2 border-t">
                    <span>Grand Total:</span>
                    <span>₹${grandTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;

    billPreviewContent.innerHTML = billContent;
    toggleModal(saveBillModal, false);
    toggleModal(billPreviewModal, true);

    // Clear bill items after saving
    billItems = [];
    updateBillSummary();
    saveItems();
    showNotification('Bill generated and saved successfully!', 'success');
}

function downloadBillPdf() {
    if (billItems.length === 0) {
        showNotification('Please add items to the bill before downloading.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set up fonts and colors
    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.setTextColor(75, 85, 99);  // Indigo color for the title

    // Add title
    doc.text("Trishul-bill ERP System", 105, 15, null, null, "center");

    // Reset text color to black
    doc.setTextColor(0, 0, 0);

    // Add bill details
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 25);
    doc.text(`Bill No: ${Date.now()}`, 20, 30);

    // Create table headers
    const headers = [["Item", "MRP", "Qty", "Discount", "Add. Fee", "Total"]];
    const data = billItems.map(item => [
        item.name,
        item.price.toFixed(2),
        item.quantity.toString(),
        item.discountPercent.toFixed(2),
        item.additionalFee.toFixed(2),
        item.totalPrice.toFixed(2)
    ]);

    // Auto table plugin with adjusted column widths and alignment
    doc.autoTable({
        head: headers,
        body: data,
        startY: 40,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 50, halign: 'left' },
            1: { cellWidth: 25, halign: 'right' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, halign: 'center' },
        didParseCell: function(data) {
            if (data.section === 'body' && [1, 4, 5].includes(data.column.index)) {
                data.cell.text = '₹' + data.cell.text;
            }
            if (data.section === 'body' && data.column.index === 3) {
                data.cell.text = data.cell.text + '%';
            }
        }
    });

    // Calculate totals
    const subtotal = billItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const gstPercent = parseFloat(saveBillForm.gstPercent.value) || 0;
    const gstAmount = subtotal * (gstPercent / 100);
    const grandTotal = subtotal + gstAmount;

    // Add summary section
    const summaryY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text("Summary:", 20, summaryY);
    doc.setDrawColor(79, 70, 229);
    doc.line(20, summaryY + 2, 190, summaryY + 2);

    const summaryData = [
        ["Subtotal:", `₹${subtotal.toFixed(2)}`],
        [`GST (${gstPercent}%):`, `₹${gstAmount.toFixed(2)}`],
        ["Grand Total:", `₹${grandTotal.toFixed(2)}`]
    ];

    doc.autoTable({
        body: summaryData,
        startY: summaryY + 5,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: {
            0: { cellWidth: 150, fontStyle: 'bold' },
            1: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        }
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(150);
        doc.text('Page ' + String(i) + ' of ' + String(pageCount), doc.internal.pageSize.width / 2, 287, {
            align: 'center'
        });
    }

    // Save the PDF
    doc.save("Trishul-bill_invoice.pdf");
    showNotification('Bill PDF downloaded successfully!', 'success');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

function saveItems() {
    localStorage.setItem('items', JSON.stringify(items));
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

// Initialize the application
function init() {
    renderItems();
}

// Start the application
init();
