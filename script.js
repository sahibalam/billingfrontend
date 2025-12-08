document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Initialize products table with sample data
    initializeProducts();
    
    // Add product button
    document.getElementById('addProduct').addEventListener('click', addProductRow);
    
    // Generate PDF button
    document.getElementById('generatePDF').addEventListener('click', generatePDF);
    
    // Preview button
    document.getElementById('previewBtn').addEventListener('click', previewInvoice);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Calculate amount when rate or quantity changes
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('calc-input')) {
            calculateRow(e.target.closest('tr'));
            calculateTotals();
        }
    });
    
    // Initialize calculations
    calculateTotals();
});

let productCounter = 1;

function initializeProducts() {
    // Sample products data matching your PDF
    const sampleProducts = [
        { description: 'H9QA9108L660', size: 'SZ-6', hsn: '640220', quantity: 24, rate: 108.60 },
        { description: 'H2K196806948', size: 'SZ-6X9', hsn: '640220', quantity: 24, rate: 99.00 },
        { description: 'H2BBA6711260', size: 'SZ-2', hsn: '640220', quantity: 24, rate: 81.00 },
        { description: '11STL7704760', size: 'SZ-4X7', hsn: '640220', quantity: 24, rate: 150.60 },
        { description: 'H2MS700095872', size: 'SZ-05X08', hsn: '640220', quantity: 24, rate: 62.40 }
    ];
    
    sampleProducts.forEach(product => {
        addProductRow(product);
    });
}

function addProductRow(productData = {}) {
    const tbody = document.getElementById('productTableBody');
    const row = document.createElement('tr');
    const srNo = productCounter++;
    
    const initialMrp = productData.mrp || productData.rate || '';
    const initialDiscount = productData.discount || 0;

    row.innerHTML = `
        <td>${srNo}</td>
        <td><input type="text" class="calc-input" value="${productData.description || ''}" placeholder="Product code" style="width: 90%;"></td>
        <td><input type="text" class="calc-input" value="${productData.size || ''}" placeholder="Size" style="width: 90%;"></td>
        <td><input type="text" class="calc-input" value="${productData.hsn || '640220'}" placeholder="HSN Code" style="width: 90%;"></td>
        <td><input type="number" class="calc-input qty" step="0.01" value="${productData.quantity || ''}" placeholder="Qty" style="width: 90%;"></td>
        <td><input type="number" class="calc-input mrp" step="0.01" value="${initialMrp}" placeholder="MRP" style="width: 90%;"></td>
        <td><input type="number" class="calc-input discount" step="0.01" value="${initialDiscount}" placeholder="Discount %" style="width: 90%;"></td>
        <td><input type="number" class="calc-input rate" step="0.01" value="${productData.rate || ''}" placeholder="Rate" style="width: 90%;" readonly></td>
        <td><input type="number" class="amount" readonly value="0" style="width: 90%;"></td>
        <td><button type="button" class="btn-action remove-row"><i class="fas fa-trash"></i></button></td>
    `;
    
    tbody.appendChild(row);
    
    // Add event listener to remove button
    row.querySelector('.remove-row').addEventListener('click', function() {
        row.remove();
        renumberRows();
        calculateTotals();
    });
    
    // Calculate initial amount
    calculateRow(row);
}

function calculateRow(row) {
    const qty = parseFloat(row.querySelector('.qty')?.value) || 0;
    const mrp = parseFloat(row.querySelector('.mrp')?.value) || 0;
    const discount = parseFloat(row.querySelector('.discount')?.value) || 0;

    // Calculate rate based on MRP and discount: Rate = MRP - (discount% of MRP)
    let rate = parseFloat(row.querySelector('.rate')?.value) || 0;
    if (mrp > 0) {
        const effectiveDiscount = isNaN(discount) ? 0 : discount;
        rate = mrp - (mrp * (effectiveDiscount / 100));
        row.querySelector('.rate').value = rate.toFixed(2);
    }

    const amount = qty * rate;
    row.querySelector('.amount').value = amount.toFixed(2);
}

function renumberRows() {
    const rows = document.querySelectorAll('#productTableBody tr');
    rows.forEach((row, index) => {
        row.querySelector('td:first-child').textContent = index + 1;
    });
    productCounter = rows.length + 1;
}

function calculateTotals() {
    const amountInputs = document.querySelectorAll('#productTableBody .amount');
    let totalQty = 0;
    let totalAmount = 0;
    
    document.querySelectorAll('#productTableBody .qty').forEach(input => {
        totalQty += parseFloat(input.value) || 0;
    });
    
    amountInputs.forEach(input => {
        totalAmount += parseFloat(input.value) || 0;
    });
    
    return { totalQty, totalAmount };
}

function previewInvoice() {
    const formData = collectFormData();
    const previewContent = document.getElementById('previewContent');
    const previewSection = document.getElementById('previewSection');
    
    // Generate preview HTML
    const previewHTML = generatePreviewHTML(formData);
    previewContent.innerHTML = previewHTML;
    previewSection.style.display = 'block';
    
    // Scroll to preview
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

function generatePreviewHTML(data) {
    const { totalQty, totalAmount } = calculateTotals();
    const cgstRate = parseFloat(document.getElementById('cgstRate').value) || 2.5;
    const sgstRate = parseFloat(document.getElementById('sgstRate').value) || 2.5;
    const cgstAmount = (totalAmount * cgstRate / 100);
    const sgstAmount = (totalAmount * sgstRate / 100);
    const taxTotal = cgstAmount + sgstAmount;
    const grandTotal = totalAmount + taxTotal;
    
    let productsHTML = '';
    data.products.forEach((product, index) => {
        productsHTML += `
            <tr>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #000; padding: 4px;">
                    ${product.description}<br>
                    <small>${product.size}</small>
                </td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${product.hsn}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${parseFloat(product.quantity).toFixed(2)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${parseFloat(product.rate).toFixed(2)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">PRS</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${parseFloat(product.amount).toFixed(2)}</td>
            </tr>
        `;
    });
    
    return `
        <div class="invoice-preview" style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.2;">
            <!-- Header Section -->
            <div style="text-align: center; margin-bottom: 10px;">
                <h2 style="font-size: 16px; margin: 5px 0; font-weight: bold;">Tax Invoice</h2>
                <div style="font-size: 10px;">(ORIGINAL FOR RECIPIENT)</div>
            </div>
            
            <!-- Business Info Table -->
            <div style="border: 1px solid #000; margin-bottom: 10px;">
                <div style="display: flex;">
                    <!-- Left Side - Business Info -->
                    <div style="width: 50%; padding: 5px; border-right: 1px solid #000;">
                        <div style="font-weight: bold; font-size: 11px;">MUFIZ TRADERS</div>
                        <div style="font-size: 10px;">K5/22/A</div>
                        <div style="font-size: 10px;">NEW UTTAR CHAKMIR, FAKIR PARA ROAD</div>
                        <div style="font-size: 10px;">West Bengal, 700142</div>
                        <div style="font-size: 10px;">GSTIN/UIN: 19ACNPA7760L2Z2</div>
                        <div style="font-size: 10px;">State Name : West Bengal, Code : 19</div>
                    </div>
                    
                    <!-- Right Side - Invoice Details -->
                    <div style="width: 50%; padding: 5px;">
                        <table style="width: 100%; font-size: 10px;">
                            <tr>
                                <td style="width: 40%;">Invoice No.</td>
                                <td style="width: 60%; font-weight: bold;">: ${data.invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td>Dated</td>
                                <td>: ${formatDateForDisplay(data.invoiceDate)}</td>
                            </tr>
                            <tr>
                                <td>Delivery Note</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Model/Terms of Payment</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Buyer's Order No.</td>
                                <td>: ${data.orderNumber || ''}</td>
                            </tr>
                            <tr>
                                <td>Dated</td>
                                <td>: ${formatDateForDisplay(data.orderDate) || ''}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Consignee Section -->
            <div style="border: 1px solid #000; margin-bottom: 10px;">
                <div style="display: flex;">
                    <!-- Left Side - Consignee -->
                    <div style="width: 50%; padding: 5px; border-right: 1px solid #000;">
                        <div style="font-weight: bold; font-size: 10px;">Consignee (Ship to)</div>
                        <div style="font-size: 10px; font-weight: bold;">${data.buyerName}</div>
                        <div style="font-size: 10px;">${data.buyerAddress}</div>
                        <div style="font-size: 10px;">KOLKATA-${data.buyerPincode}</div>
                        <div style="font-size: 10px;">GSTIN/UIN: ${data.buyerGSTIN}</div>
                        <div style="font-size: 10px;">State Name: West Bengal, Code: 19</div>
                    </div>
                    
                    <!-- Right Side - Dispatch Details -->
                    <div style="width: 50%; padding: 5px;">
                        <table style="width: 100%; font-size: 10px;">
                            <tr>
                                <td style="width: 50%;">Dispatch Doc No.</td>
                                <td style="width: 50%;"></td>
                            </tr>
                            <tr>
                                <td>Delivery Note Date</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Dispatched through</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Destination</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Terms of Delivery</td>
                                <td></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Buyer Section -->
            <div style="border: 1px solid #000; margin-bottom: 10px; padding: 5px;">
                <div style="font-weight: bold; font-size: 10px; margin-bottom: 5px;">Buyer (Bill to)</div>
                <div style="display: flex; justify-content: space-between; font-size: 10px;">
                    <div>
                        <span style="font-weight: bold;">${data.buyerName}</span>
                        <span style="margin-left: 20px;">${data.buyerAddress}</span>
                        <span style="margin-left: 20px;">KOLKATA-${data.buyerPincode}</span>
                    </div>
                </div>
                <div style="font-size: 10px; margin-top: 5px;">
                    <span>GSTIN/UIN: ${data.buyerGSTIN}</span>
                    <span style="margin-left: 30px;">State Name: West Bengal, Code: 19</span>
                </div>
            </div>
            
            <!-- Products Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 5%;">Sr.</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 25%;">Description of Goods</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 15%;">HSN/SAC</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 10%;">Quantity</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 10%;">Rate</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 8%;">per</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 15%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                    <!-- Total Row -->
                    <tr>
                        <td colspan="3" style="border: 1px solid #000; padding: 4px; font-weight: bold;">Total</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">${totalQty.toFixed(2)} PRS</td>
                        <td style="border: 1px solid #000; padding: 4px;"></td>
                        <td style="border: 1px solid #000; padding: 4px;"></td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">${totalAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Amount in Words -->
            <div style="margin-bottom: 10px; font-size: 10px;">
                <div>Amount Chargeable (in words)</div>
                <div style="font-weight: bold;">INR ${numberToWords(grandTotal)} Only</div>
            </div>
            
            <!-- Tax Table -->
            <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">Taxable Value</div>
                <div style="border: 1px solid #000; padding: 5px;">
                    <table style="width: 100%; font-size: 10px;">
                        <tr>
                            <td style="width: 30%; font-weight: bold;">CGST</td>
                            <td style="width: 10%;">Rate</td>
                            <td style="width: 10%; text-align: center;">${cgstRate}%</td>
                            <td style="width: 15%;">Amount</td>
                            <td style="width: 35%; text-align: right;">${cgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">SGST</td>
                            <td>Rate</td>
                            <td style="text-align: center;">${sgstRate}%</td>
                            <td>Amount</td>
                            <td style="text-align: right;">${sgstAmount.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-top: 5px; font-size: 10px;">
                    <div>Tax Amount (in words)</div>
                    <div style="font-weight: bold;">INR ${numberToWords(taxTotal)} Only</div>
                </div>
            </div>
            
            <!-- Declaration and Bank Details -->
            <div style="display: flex; margin-bottom: 20px;">
                <!-- Declaration -->
                <div style="width: 48%; border: 1px solid #000; padding: 5px; margin-right: 4%;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">Declaration</div>
                    <div style="font-size: 9px;">
                        We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                    </div>
                </div>
                
                <!-- Bank Details -->
                <div style="width: 48%; border: 1px solid #000; padding: 5px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">Company's Bank Details</div>
                    <div style="font-size: 9px;">
                        <div>A/c Holder's Name : MUFIZ TRADERS</div>
                        <div>Bank Name : PUNJAB NATIONAL BANK</div>
                        <div>A/c No. : 0339250006928</div>
                        <div>Branch & IFS Code : PUNB0140600</div>
                    </div>
                </div>
            </div>
            
            <!-- Signature Section -->
            <div style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <div style="width: 40%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 9px;">
                            Customer's Seal and Signature
                        </div>
                    </div>
                    <div style="width: 40%; text-align: right;">
                        <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 9px;">
                            for MUFIZ TRADERS
                        </div>
                    </div>
                </div>
                <div style="text-align: right; margin-top: 20px; font-size: 8px;">
                    Authorised Signatory
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 8px; font-style: italic;">
                    This is a Computer Generated Invoice
                </div>
            </div>
        </div>
    `;
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
    } catch (error) {
        return dateString;
    }
}

function collectFormData() {
    const products = [];
    document.querySelectorAll('#productTableBody tr').forEach(row => {
        const description = row.querySelector('td:nth-child(2) input').value;
        const size = row.querySelector('td:nth-child(3) input').value;
        const hsn = row.querySelector('td:nth-child(4) input').value;
        const quantity = parseFloat(row.querySelector('.qty').value) || 0;
        const rate = parseFloat(row.querySelector('.rate').value) || 0;
        const amount = parseFloat(row.querySelector('.amount').value) || 0;
        
        products.push({
            description,
            size,
            hsn,
            quantity,
            rate,
            amount
        });
    });
    
    return {
        buyerName: document.getElementById('buyerName').value,
        buyerAddress: document.getElementById('buyerAddress').value,
        buyerCity: document.getElementById('buyerCity').value,
        buyerPincode: document.getElementById('buyerPincode').value,
        buyerGSTIN: document.getElementById('buyerGSTIN').value,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        orderNumber: document.getElementById('orderNumber').value,
        orderDate: document.getElementById('orderDate').value,
        cgstRate: document.getElementById('cgstRate').value,
        sgstRate: document.getElementById('sgstRate').value,
        products
    };
}

async function generatePDF() {
    const formData = collectFormData();
    
    // Validate form
    if (!formData.buyerName || !formData.invoiceNumber || !formData.invoiceDate) {
        alert('Please fill all required fields');
        return;
    }
    
    if (formData.products.length === 0) {
        alert('Please add at least one product');
        return;
    }
    
    try {
        // Show loading
        const generateBtn = document.getElementById('generatePDF');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        generateBtn.disabled = true;
        
        // Call deployed AWS Lambda endpoint for invoice PDF generation
        const response = await fetch('https://396sen1eal.execute-api.ap-south-1.amazonaws.com/generate-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${formData.invoiceNumber}_${formData.invoiceDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert('✅ PDF generated successfully!');
        } else {
            const error = await response.json();
            alert('❌ Error generating PDF: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Failed to generate PDF. Please check if the server is running.');
    } finally {
        // Reset button
        const generateBtn = document.getElementById('generatePDF');
        generateBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Generate PDF';
        generateBtn.disabled = false;
    }
}

function resetForm() {
    if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
        document.getElementById('invoiceForm').reset();
        document.getElementById('productTableBody').innerHTML = '';
        document.getElementById('previewSection').style.display = 'none';
        productCounter = 1;
        initializeProducts();
        calculateTotals();
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
    }
}

function numberToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    let n = Math.floor(num);
    if (n === 0) return 'Zero';
    
    let words = '';
    
    // Handle crores (10,000,000)
    if (n >= 10000000) {
        const crores = Math.floor(n / 10000000);
        words += numberToWords(crores) + ' Crore ';
        n %= 10000000;
    }
    
    // Handle lakhs (100,000)
    if (n >= 100000) {
        const lakhs = Math.floor(n / 100000);
        words += numberToWords(lakhs) + ' Lakh ';
        n %= 100000;
    }
    
    // Handle thousands (1,000)
    if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        words += numberToWords(thousands) + ' Thousand ';
        n %= 1000;
    }
    
    // Handle hundreds (100)
    if (n >= 100) {
        const hundreds = Math.floor(n / 100);
        words += numberToWords(hundreds) + ' Hundred ';
        n %= 100;
    }
    
    // Handle tens and ones (0-99)
    if (n > 0) {
        if (n < 20) {
            words += a[n];
        } else {
            words += b[Math.floor(n / 10)];
            if (n % 10 > 0) {
                words += '-' + a[n % 10];
            }
        }
    }
    
    // Handle paise
    const paise = Math.round((num - Math.floor(num)) * 100);
    if (paise > 0) {
        words += ' and ' + numberToWords(paise) + ' Paise';
    }
    
    return words.trim() + ' Rupees';
}