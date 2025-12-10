/* =========================================================
   utils.js – Helper functions for the entire POS system
========================================================= */

/* Generate Unique IDs */
function uid() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

/* Format number as currency */
function money(amount) {
    return parseFloat(amount).toFixed(2);
}

/* Today's date (yyyy-mm-dd) */
function today() {
    return new Date().toISOString().split("T")[0];
}

/* Convert file to base64 (for product images) */
function fileToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
}

/* Save to LocalStorage */
function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/* Load from LocalStorage */
function load(key, fallback) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
}

/* Play sound effect */
function playSound(name) {
    const audio = new Audio(`assets/sounds/${name}.mp3`);
    audio.volume = 0.4;
    audio.play();
}
/* =========================================================
   ui.js – UI controls, theme switch, popups, animations
========================================================= */

/* =========================
   SHOW POPUP ANIMATION
========================= */
function showPopup(message, type = "info") {
    const popup = document.getElementById("popup");
    popup.innerText = message;

    // Colors
    if (type === "success") popup.style.background = "#28c76f";
    else if (type === "error") popup.style.background = "#ff4d4d";
    else popup.style.background = "var(--primary)";

    popup.classList.add("popup-show");
    popup.classList.remove("popup-hidden");

    setTimeout(() => {
        popup.classList.remove("popup-show");
        popup.classList.add("popup-hidden");
    }, 2000);
}

/* =========================
   TAB SWITCHING
========================= */
document.querySelectorAll("#topNav .nav-item").forEach(tab => {
    tab.addEventListener("click", () => {

        // Remove active class from all tabs
        document.querySelectorAll(".nav-item").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        // Show selected tab
        const target = tab.getAttribute("data-tab");
        document.querySelectorAll(".tab").forEach(s => s.classList.remove("active"));
        document.getElementById(target).classList.add("active");

        playSound("success");
    });
});

/* =========================
   THEME TOGGLE
========================= */
document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const icon = document.getElementById("themeToggle");
    icon.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙";

    save("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

/* Load theme from LocalStorage */
(function loadTheme() {
    const theme = load("theme", "light");
    if (theme === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeToggle").innerText = "☀️";
    }
})();
/* =========================================================
   app.js – Main application initializer
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("%cSupermarket POS Loaded", "color:#1a8cff;font-size:16px");

    // LOAD STORE SETTINGS
    loadStoreSettings();

    // INITIALIZE PRODUCT SYSTEM
    if (typeof loadProducts === "function") loadProducts();

    // INITIALIZE CART SYSTEM
    if (typeof initCart === "function") initCart();

    // INITIALIZE ADMIN PANEL
    if (typeof adminInit === "function") adminInit();

    // INITIALIZE DASHBOARD
    if (typeof dashboardInit === "function") dashboardInit();

    // INITIALIZE SCANNER
    if (typeof initScanner === "function") initScanner();

    showPopup("System Ready", "success");
});

/* ======================
   LOAD STORE SETTINGS
====================== */
function loadStoreSettings() {
    const store = load("settings", {
        storeName: "My Supermarket",
        taxRate: 5,
        currency: "USD"
    });

    // Set UI fields
    document.getElementById("storeNameSetting").value = store.storeName;
    document.getElementById("taxRateSetting").value = store.taxRate;
    document.getElementById("currencySetting").value = store.currency;
}
/* =========================================================
   data.js – LocalStorage Database for Supermarket POS
========================================================= */

/* =========================
   DATABASE STRUCTURE
========================= */

const DB = {

    products: load("products", []),

    categories: load("categories", [
        "Fruits & Vegetables",
        "Meat & Fish",
        "Dairy",
        "Bakery",
        "Snacks",
        "Frozen",
        "Beverages",
        "Household",
        "Personal Care",
        "Electronics"
    ]),

    cart: load("cart", []),

    invoices: load("invoices", []),

    settings: load("settings", {
        storeName: "My Supermarket",
        taxRate: 5,
        currency: "USD"
    })
};

/* =========================================================
   PRODUCT MANAGEMENT
========================================================= */

/* Create New Product Object */
function createProduct(data) {
    return {
        id: uid(),
        name: data.name,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        category: data.category,
        barcode: data.barcode || "",
        expiry: data.expiry || "",
        image: data.image || "",
        created: today()
    };
}

/* Save all products */
function saveProducts() {
    save("products", DB.products);
}

/* Add product */
function addProduct(data) {
    DB.products.push(createProduct(data));
    saveProducts();
}

/* Update product */
function updateProduct(id, newData) {
    DB.products = DB.products.map(p =>
        p.id === id ? { ...p, ...newData } : p
    );
    saveProducts();
}

/* Delete product */
function deleteProduct(id) {
    DB.products = DB.products.filter(p => p.id !== id);
    saveProducts();
}

/* Get specific product */
function getProduct(id) {
    return DB.products.find(p => p.id === id);
}

/* Get product by barcode */
function getProductByBarcode(barcode) {
    return DB.products.find(p => p.barcode === barcode);
}

/* =========================================================
   CART MANAGEMENT
========================================================= */

function saveCart() {
    save("cart", DB.cart);
}

function addToCart(productId, qty) {
    qty = parseInt(qty);

    const product = getProduct(productId);
    if (!product) return false;

    const found = DB.cart.find(item => item.id === productId);

    if (found) found.qty += qty;
    else DB.cart.push({ id: productId, qty });

    saveCart();
    return true;
}

function updateCart(id, qty) {
    DB.cart = DB.cart.map(item =>
        item.id === id ? { ...item, qty } : item
    );
    saveCart();
}

function removeFromCart(id) {
    DB.cart = DB.cart.filter(item => item.id !== id);
    saveCart();
}

function clearCart() {
    DB.cart = [];
    saveCart();
}

/* =========================================================
   INVOICE MANAGEMENT
========================================================= */

function saveInvoice(invoice) {
    DB.invoices.push(invoice);
    save("invoices", DB.invoices);
}

function getInvoicesBetween(from, to) {
    return DB.invoices.filter(x => x.date >= from && x.date <= to);
}

/* =========================================================
   SALES ANALYTICS
========================================================= */

function totalSalesToday() {
    const d = today();
    return DB.invoices
        .filter(inv => inv.date === d)
        .reduce((sum, inv) => sum + inv.total, 0);
}

function totalSalesMonth() {
    const month = new Date().toISOString().substring(0, 7);
    return DB.invoices
        .filter(inv => inv.date.startsWith(month))
        .reduce((sum, inv) => sum + inv.total, 0);
}

function getLowStock(threshold = 5) {
    return DB.products.filter(p => p.stock <= threshold);
}

/* =========================================================
   SETTINGS
========================================================= */

function saveSettings(settings) {
    DB.settings = settings;
    save("settings", settings);
}

/* =========================================================
   DEFAULT PRODUCT SEEDING (First-time setup)
========================================================= */

if (DB.products.length === 0) {
    console.log("Seeding default supermarket items...");

    const DEFAULT_PRODUCTS = [
        // FRUITS & VEGETABLES
        { name: "Bananas", price: 1.20, stock: 80, category: "Fruits & Vegetables", barcode: "10001" },
        { name: "Tomatoes", price: 2.10, stock: 60, category: "Fruits & Vegetables", barcode: "10002" },
        { name: "Potatoes", price: 1.50, stock: 120, category: "Fruits & Vegetables", barcode: "10003" },
        { name: "Onions", price: 1.10, stock: 90, category: "Fruits & Vegetables", barcode: "10004" },

        // MEAT & FISH
        { name: "Chicken Breast", price: 7.99, stock: 40, category: "Meat & Fish", barcode: "20001" },
        { name: "Ground Beef", price: 9.50, stock: 35, category: "Meat & Fish", barcode: "20002" },
        { name: "Fresh Salmon", price: 14.00, stock: 20, category: "Meat & Fish", barcode: "20003" },

        // DAIRY
        { name: "Whole Milk 1L", price: 1.30, stock: 50, category: "Dairy", barcode: "30001" },
        { name: "Butter 200g", price: 2.50, stock: 40, category: "Dairy", barcode: "30002" },
        { name: "Mozzarella Cheese", price: 4.20, stock: 25, category: "Dairy", barcode: "30003" },

        // BAKERY
        { name: "Fresh Bread", price: 1.00, stock: 30, category: "Bakery", barcode: "40001" },
        { name: "Croissant", price: 0.80, stock: 20, category: "Bakery", barcode: "40002" },

        // SNACKS
        { name: "Potato Chips Large", price: 2.50, stock: 70, category: "Snacks", barcode: "50001" },
        { name: "Chocolate Bar", price: 1.20, stock: 90, category: "Snacks", barcode: "50002" },

        // BEVERAGES
        { name: "Coca Cola 1.25L", price: 1.40, stock: 100, category: "Beverages", barcode: "60001" },
        { name: "Orange Juice 1L", price: 2.00, stock: 50, category: "Beverages", barcode: "60002" },

        // HOUSEHOLD
        { name: "Laundry Detergent 1kg", price: 5.50, stock: 30, category: "Household", barcode: "70001" },
        { name: "Dish Soap", price: 1.60, stock: 45, category: "Household", barcode: "70002" },

        // PERSONAL CARE
        { name: "Shampoo 500ml", price: 3.40, stock: 35, category: "Personal Care", barcode: "80001" },
        { name: "Toothpaste", price: 1.50, stock: 60, category: "Personal Care", barcode: "80002" },

        // ELECTRONICS
        { name: "AA Batteries (4 pack)", price: 2.80, stock: 50, category: "Electronics", barcode: "90001" }
    ];

    DEFAULT_PRODUCTS.forEach(p => addProduct(p));

    console.log("Default items added.");
}
/* =========================================================
   products.js – Product Display & Customer Interaction
========================================================= */

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortProducts");

/* =========================
   LOAD PRODUCTS INTO UI
========================= */
function loadProducts() {

    // Populate category filter
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    DB.categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.innerText = cat;
        categoryFilter.appendChild(opt);
    });

    renderProducts(DB.products);

    // Event Listeners
    searchInput.addEventListener("input", filterProducts);
    categoryFilter.addEventListener("change", filterProducts);
    sortSelect.addEventListener("change", filterProducts);
}

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(products) {
    productsGrid.innerHTML = "";

    products.forEach(p => {

        const card = document.createElement("div");
        card.classList.add("product-card");

        // Product Image
        const img = document.createElement("img");
        img.src = p.image || "https://via.placeholder.com/150?text=No+Image";
        card.appendChild(img);

        // Name
        const name = document.createElement("div");
        name.className = "product-name";
        name.innerText = p.name;
        card.appendChild(name);

        // Price
        const price = document.createElement("div");
        price.className = "price";
        price.innerText = `${DB.settings.currency} ${money(p.price)}`;
        card.appendChild(price);

        // Stock warning
        if (p.stock <= 5) {
            const low = document.createElement("div");
            low.className = "low-stock";
            low.innerText = `Low Stock: ${p.stock}`;
            card.appendChild(low);
        }

        // Quantity row
        const qtyRow = document.createElement("div");
        qtyRow.className = "qty-row";
        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.min = 1;
        qtyInput.max = p.stock;
        qtyInput.value = 1;
        qtyRow.appendChild(qtyInput);

        // Add to cart button
        const addBtn = document.createElement("button");
        addBtn.className = "btn";
        addBtn.innerText = "Add to Cart";
        addBtn.addEventListener("click", () => {
            const qty = parseInt(qtyInput.value);
            if (qty > p.stock) {
                showPopup("Not enough stock!", "error");
                return;
            }

            addToCart(p.id, qty);
            showPopup(`${p.name} added to cart`, "success");

            // Optional: play sound
            playSound("add-to-cart");

            // Update stock locally
            p.stock -= qty;
            renderProducts(products);
            if (typeof refreshCart === "function") refreshCart();
        });

        qtyRow.appendChild(addBtn);
        card.appendChild(qtyRow);

        productsGrid.appendChild(card);
    });
}

/* =========================
   FILTER + SORT PRODUCTS
========================= */
function filterProducts() {
    let filtered = [...DB.products];

    // Search
    const keyword = searchInput.value.toLowerCase();
    if (keyword) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(keyword));
    }

    // Category
    const category = categoryFilter.value;
    if (category) filtered = filtered.filter(p => p.category === category);

    // Sorting
    const sortBy = sortSelect.value;
    if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "price") filtered.sort((a, b) => a.price - b.price);
    if (sortBy === "stock") filtered.sort((a, b) => a.stock - b.stock);

    renderProducts(filtered);
}
/* =========================================================
   cart.js – Shopping Cart Management
========================================================= */

const cartList = document.getElementById("cartList");
const subtotalEl = document.getElementById("subtotal");
const discountEl = document.getElementById("discount");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const checkoutBtn = document.getElementById("checkoutBtn");
const paymentMethodEl = document.getElementById("paymentMethod");

/* =========================
   INITIALIZE CART
========================= */
function initCart() {
    refreshCart();

    checkoutBtn.addEventListener("click", () => {
        if (DB.cart.length === 0) {
            showPopup("Cart is empty!", "error");
            return;
        }

        const invoice = generateInvoice();
        saveInvoice(invoice);

        // Deduct stock from products
        invoice.items.forEach(item => {
            const prod = getProduct(item.id);
            if (prod) {
                prod.stock -= item.qty;
            }
        });
        saveProducts();

        clearCart();
        refreshCart();
        if (typeof renderProducts === "function") renderProducts(DB.products);

        showPopup(`Invoice #${invoice.id} generated`, "success");

        // Optionally print invoice
        if (typeof printInvoice === "function") printInvoice(invoice);
    });
}

/* =========================
   REFRESH CART DISPLAY
========================= */
function refreshCart() {
    cartList.innerHTML = "";

    if (DB.cart.length === 0) {
        cartList.innerHTML = "<p>Your cart is empty.</p>";
        subtotalEl.innerText = "0.00";
        discountEl.innerText = "0.00";
        taxEl.innerText = "0.00";
        totalEl.innerText = "0.00";
        return;
    }

    let subtotal = 0;
    const taxRate = DB.settings.taxRate || 0;
    const discount = 0; // Can be extended later

    DB.cart.forEach(item => {
        const product = getProduct(item.id);
        if (!product) return;

        const row = document.createElement("div");
        row.className = "cart-item";
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.marginBottom = "8px";

        const name = document.createElement("span");
        name.innerText = `${product.name} (${DB.settings.currency} ${money(product.price)})`;
        row.appendChild(name);

        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.value = item.qty;
        qtyInput.min = 1;
        qtyInput.max = product.stock + item.qty; // allow updating back to max
        qtyInput.style.width = "60px";
        qtyInput.addEventListener("change", () => {
            const newQty = parseInt(qtyInput.value);
            if (newQty > product.stock + item.qty) {
                showPopup("Not enough stock!", "error");
                qtyInput.value = item.qty;
                return;
            }
            updateCart(item.id, newQty);
            refreshCart();
        });
        row.appendChild(qtyInput);

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn";
        removeBtn.innerText = "Remove";
        removeBtn.style.marginLeft = "8px";
        removeBtn.addEventListener("click", () => {
            removeFromCart(item.id);
            refreshCart();
        });
        row.appendChild(removeBtn);

        cartList.appendChild(row);

        subtotal += product.price * item.qty;
    });

    const tax = subtotal * (taxRate / 100);
    const total = subtotal - discount + tax;

    subtotalEl.innerText = money(subtotal);
    discountEl.innerText = money(discount);
    taxEl.innerText = money(tax);
    totalEl.innerText = money(total);
}

/* =========================
   GENERATE INVOICE OBJECT
========================= */
function generateInvoice() {
    const invoiceItems = DB.cart.map(item => {
        const product = getProduct(item.id);
        return {
            id: product.id,
            name: product.name,
            price: product.price,
            qty: item.qty,
            total: product.price * item.qty
        };
    });

    const subtotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);
    const tax = subtotal * (DB.settings.taxRate / 100);
    const discount = 0; // Can extend
    const total = subtotal - discount + tax;

    const invoice = {
        id: uid(),
        date: today(),
        items: invoiceItems,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: paymentMethodEl.value || "Cash"
    };

    return invoice;
}
/* =========================================================
   admin.js – Admin Panel Management
========================================================= */

const adminProductList = document.getElementById("adminProductList");
const addProductForm = document.getElementById("addProductForm");
const adminCategorySelect = document.getElementById("adminCategorySelect");
const settingsForm = document.getElementById("settingsForm");

/* =========================
   INITIALIZE ADMIN PANEL
========================= */
function adminInit() {
    populateCategorySelect();
    renderAdminProducts();

    // Add Product Form
    addProductForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const data = {
            name: addProductForm.name.value,
            price: parseFloat(addProductForm.price.value),
            stock: parseInt(addProductForm.stock.value),
            category: addProductForm.category.value,
            barcode: addProductForm.barcode.value,
            expiry: addProductForm.expiry.value
        };

        const file = addProductForm.image.files[0];
        if (file) {
            fileToBase64(file, (base64) => {
                data.image = base64;
                addProduct(data);
                renderAdminProducts();
                showPopup(`${data.name} added`, "success");
                addProductForm.reset();
                populateCategorySelect();
            });
        } else {
            addProduct(data);
            renderAdminProducts();
            showPopup(`${data.name} added`, "success");
            addProductForm.reset();
            populateCategorySelect();
        }
    });

    // Settings Form
    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newSettings = {
            storeName: settingsForm.storeName.value,
            taxRate: parseFloat(settingsForm.taxRate.value),
            currency: settingsForm.currency.value
        };
        saveSettings(newSettings);
        showPopup("Settings saved", "success");
    });
}

/* =========================
   RENDER ADMIN PRODUCT LIST
========================= */
function renderAdminProducts() {
    adminProductList.innerHTML = "";

    DB.products.forEach(p => {
        const div = document.createElement("div");
        div.className = "admin-product";

        const name = document.createElement("div");
        name.innerText = `${p.name} (${DB.settings.currency} ${money(p.price)})`;
        name.style.fontWeight = "bold";
        div.appendChild(name);

        const category = document.createElement("div");
        category.innerText = `Category: ${p.category}`;
        div.appendChild(category);

        const stock = document.createElement("div");
        stock.innerText = `Stock: ${p.stock}`;
        div.appendChild(stock);

        // Edit Button
        const editBtn = document.createElement("button");
        editBtn.className = "btn";
        editBtn.innerText = "Edit";
        editBtn.addEventListener("click", () => editProductPrompt(p.id));
        div.appendChild(editBtn);

        // Delete Button
        const delBtn = document.createElement("button");
        delBtn.className = "btn";
        delBtn.innerText = "Delete";
        delBtn.style.marginLeft = "8px";
        delBtn.addEventListener("click", () => {
            if (confirm(`Delete ${p.name}?`)) {
                deleteProduct(p.id);
                renderAdminProducts();
                showPopup(`${p.name} deleted`, "success");
            }
        });
        div.appendChild(delBtn);

        adminProductList.appendChild(div);
    });
}

/* =========================
   EDIT PRODUCT PROMPT
========================= */
function editProductPrompt(id) {
    const p = getProduct(id);
    if (!p) return;

    const newName = prompt("Product Name:", p.name) || p.name;
    const newPrice = parseFloat(prompt("Price:", p.price)) || p.price;
    const newStock = parseInt(prompt("Stock:", p.stock)) || p.stock;
    const newCategory = prompt("Category:", p.category) || p.category;
    const newBarcode = prompt("Barcode:", p.barcode) || p.barcode;
    const newExpiry = prompt("Expiry:", p.expiry) || p.expiry;

    updateProduct(id, {
        name: newName,
        price: newPrice,
        stock: newStock,
        category: newCategory,
        barcode: newBarcode,
        expiry: newExpiry
    });

    renderAdminProducts();
    showPopup(`${newName} updated`, "success");
}

/* =========================
   CATEGORY SELECT POPULATION
========================= */
function populateCategorySelect() {
    adminCategorySelect.innerHTML = "";
    DB.categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.innerText = cat;
        adminCategorySelect.appendChild(opt);
    });
}
/* =========================================================
   invoice.js – Invoice Generation & Printing
========================================================= */

const invoiceContainer = document.getElementById("invoiceContainer");

/* =========================
   PRINT INVOICE
========================= */
function printInvoice(invoice) {
    if (!invoice) return;

    invoiceContainer.innerHTML = ""; // clear previous

    const div = document.createElement("div");
    div.className = "invoice";

    const title = document.createElement("h2");
    title.innerText = `${DB.settings.storeName} Invoice`;
    title.style.textAlign = "center";
    div.appendChild(title);

    const idEl = document.createElement("p");
    idEl.innerText = `Invoice ID: ${invoice.id}`;
    div.appendChild(idEl);

    const dateEl = document.createElement("p");
    dateEl.innerText = `Date: ${invoice.date}`;
    div.appendChild(dateEl);

    const methodEl = document.createElement("p");
    methodEl.innerText = `Payment Method: ${invoice.paymentMethod}`;
    div.appendChild(methodEl);

    // Table of items
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th style="border-bottom:1px solid #000;text-align:left;">Item</th>
            <th style="border-bottom:1px solid #000;">Qty</th>
            <th style="border-bottom:1px solid #000;">Price</th>
            <th style="border-bottom:1px solid #000;">Total</th>
        </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    invoice.items.forEach(i => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i.name}</td>
            <td style="text-align:center;">${i.qty}</td>
            <td style="text-align:right;">${DB.settings.currency} ${money(i.price)}</td>
            <td style="text-align:right;">${DB.settings.currency} ${money(i.total)}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    div.appendChild(table);

    // Totals
    const totalsDiv = document.createElement("div");
    totalsDiv.style.textAlign = "right";
    totalsDiv.style.marginTop = "10px";
    totalsDiv.innerHTML = `
        <p>Subtotal: ${DB.settings.currency} ${money(invoice.subtotal)}</p>
        <p>Tax (${DB.settings.taxRate}%): ${DB.settings.currency} ${money(invoice.tax)}</p>
        <p>Discount: ${DB.settings.currency} ${money(invoice.discount)}</p>
        <h3>Total: ${DB.settings.currency} ${money(invoice.total)}</h3>
    `;
    div.appendChild(totalsDiv);

    invoiceContainer.appendChild(div);

    // Open print dialog
    const printWindow = window.open('', 'PRINT', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Invoice</title>');
    printWindow.document.write('<style>body{font-family:sans-serif;}table{width:100%;border-collapse:collapse;}th,td{padding:6px;border:1px solid #000;}</style>');
    printWindow.document.write('</head><body >');
    printWindow.document.write(div.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

/* =========================
   REGENERATE INVOICE (Admin)
========================= */
function regenerateInvoice(id) {
    const invoice = DB.invoices.find(inv => inv.id === id);
    if (!invoice) {
        showPopup("Invoice not found", "error");
        return;
    }
    printInvoice(invoice);
}
