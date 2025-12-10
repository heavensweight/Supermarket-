/* =========================================================
   supermarket.js – All-in-One JS for Supermarket POS
========================================================= */

/* =========================
   UTILS
========================= */
function uid() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function money(num) {
    return parseFloat(num).toFixed(2);
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function load(key, defaultValue) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defaultValue;
}

function showPopup(message, type = "info") {
    const popup = document.createElement("div");
    popup.className = `popup ${type}`;
    popup.innerText = message;
    document.body.appendChild(popup);
    popup.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
        duration: 2000
    });
    setTimeout(() => popup.remove(), 2000);
}

function fileToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = e => callback(e.target.result);
    reader.readAsDataURL(file);
}

/* =========================
   DATA / LOCAL STORAGE
========================= */
const DB = {
    products: load("products", []),
    categories: load("categories", [
        "Fruits & Vegetables","Meat & Fish","Dairy","Bakery",
        "Snacks","Frozen","Beverages","Household","Personal Care","Electronics"
    ]),
    cart: load("cart", []),
    invoices: load("invoices", []),
    settings: load("settings", { storeName: "My Supermarket", taxRate: 5, currency: "USD" })
};

/* PRODUCT CRUD */
function createProduct(data) {
    return { id: uid(), name: data.name, price: parseFloat(data.price), stock: parseInt(data.stock),
        category: data.category, barcode: data.barcode||"", expiry: data.expiry||"", image: data.image||"", created: today()
    };
}
function saveProducts(){ save("products", DB.products); }
function addProduct(data){ DB.products.push(createProduct(data)); saveProducts(); }
function updateProduct(id, newData){ DB.products = DB.products.map(p => p.id===id ? {...p,...newData} : p); saveProducts(); }
function deleteProduct(id){ DB.products = DB.products.filter(p=>p.id!==id); saveProducts(); }
function getProduct(id){ return DB.products.find(p=>p.id===id); }
function getProductByBarcode(barcode){ return DB.products.find(p=>p.barcode===barcode); }

/* CART MANAGEMENT */
function saveCart(){ save("cart", DB.cart); }
function addToCart(productId, qty){
    qty = parseInt(qty);
    const product = getProduct(productId);
    if(!product) return false;
    const found = DB.cart.find(item=>item.id===productId);
    if(found) found.qty+=qty; else DB.cart.push({id:productId,qty});
    saveCart(); return true;
}
function updateCart(id, qty){ DB.cart=DB.cart.map(item=>item.id===id?{...item,qty}:item); saveCart(); }
function removeFromCart(id){ DB.cart = DB.cart.filter(item=>item.id!==id); saveCart(); }
function clearCart(){ DB.cart = []; saveCart(); }

/* INVOICES */
function saveInvoice(invoice){ DB.invoices.push(invoice); save("invoices", DB.invoices); }
function getInvoicesBetween(from,to){ return DB.invoices.filter(x=>x.date>=from && x.date<=to); }

/* SALES */
function totalSalesToday(){ const d=today(); return DB.invoices.filter(inv=>inv.date===d).reduce((sum,inv)=>sum+inv.total,0); }
function totalSalesMonth(){ const month=new Date().toISOString().substring(0,7); return DB.invoices.filter(inv=>inv.date.startsWith(month)).reduce((sum,inv)=>sum+inv.total,0); }
function getLowStock(threshold=5){ return DB.products.filter(p=>p.stock<=threshold); }

/* SETTINGS */
function saveSettings(settings){ DB.settings=settings; save("settings",settings); }

/* =========================
   DEFAULT PRODUCT SEEDING
========================= */
if(DB.products.length===0){
    const DEFAULT_PRODUCTS = [
        { name:"Bananas", price:1.2, stock:80, category:"Fruits & Vegetables", barcode:"10001"},
        { name:"Tomatoes", price:2.1, stock:60, category:"Fruits & Vegetables", barcode:"10002"},
        { name:"Potatoes", price:1.5, stock:120, category:"Fruits & Vegetables", barcode:"10003"},
        { name:"Onions", price:1.1, stock:90, category:"Fruits & Vegetables", barcode:"10004"},
        { name:"Chicken Breast", price:7.99, stock:40, category:"Meat & Fish", barcode:"20001"},
        { name:"Ground Beef", price:9.5, stock:35, category:"Meat & Fish", barcode:"20002"},
        { name:"Fresh Salmon", price:14, stock:20, category:"Meat & Fish", barcode:"20003"},
        { name:"Whole Milk 1L", price:1.3, stock:50, category:"Dairy", barcode:"30001"},
        { name:"Butter 200g", price:2.5, stock:40, category:"Dairy", barcode:"30002"},
        { name:"Mozzarella Cheese", price:4.2, stock:25, category:"Dairy", barcode:"30003"},
        { name:"Fresh Bread", price:1, stock:30, category:"Bakery", barcode:"40001"},
        { name:"Croissant", price:0.8, stock:20, category:"Bakery", barcode:"40002"},
        { name:"Potato Chips Large", price:2.5, stock:70, category:"Snacks", barcode:"50001"},
        { name:"Chocolate Bar", price:1.2, stock:90, category:"Snacks", barcode:"50002"},
        { name:"Coca Cola 1.25L", price:1.4, stock:100, category:"Beverages", barcode:"60001"},
        { name:"Orange Juice 1L", price:2, stock:50, category:"Beverages", barcode:"60002"},
        { name:"Laundry Detergent 1kg", price:5.5, stock:30, category:"Household", barcode:"70001"},
        { name:"Dish Soap", price:1.6, stock:45, category:"Household", barcode:"70002"},
        { name:"Shampoo 500ml", price:3.4, stock:35, category:"Personal Care", barcode:"80001"},
        { name:"Toothpaste", price:1.5, stock:60, category:"Personal Care", barcode:"80002"},
        { name:"AA Batteries (4 pack)", price:2.8, stock:50, category:"Electronics", barcode:"90001"}
    ];
    DEFAULT_PRODUCTS.forEach(p=>addProduct(p));
}

/* =========================
   PRODUCTS UI
========================= */
const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortProducts");

function loadProducts() {
    categoryFilter.innerHTML=`<option value="">All Categories</option>`;
    DB.categories.forEach(cat=>{
        const opt=document.createElement("option");
        opt.value=cat; opt.innerText=cat; categoryFilter.appendChild(opt);
    });
    renderProducts(DB.products);
    searchInput.addEventListener("input",filterProducts);
    categoryFilter.addEventListener("change",filterProducts);
    sortSelect.addEventListener("change",filterProducts);
}

function renderProducts(products){
    productsGrid.innerHTML="";
    products.forEach(p=>{
        const card=document.createElement("div"); card.classList.add("product-card");
        const img=document.createElement("img"); img.src=p.image||"https://via.placeholder.com/150?text=No+Image"; card.appendChild(img);
        const name=document.createElement("div"); name.className="product-name"; name.innerText=p.name; card.appendChild(name);
        const price=document.createElement("div"); price.className="price"; price.innerText=`${DB.settings.currency} ${money(p.price)}`; card.appendChild(price);
        if(p.stock<=5){ const low=document.createElement("div"); low.className="low-stock"; low.innerText=`Low Stock: ${p.stock}`; card.appendChild(low);}
        const qtyRow=document.createElement("div"); qtyRow.className="qty-row";
        const qtyInput=document.createElement("input"); qtyInput.type="number"; qtyInput.min=1; qtyInput.max=p.stock; qtyInput.value=1; qtyRow.appendChild(qtyInput);
        const addBtn=document.createElement("button"); addBtn.className="btn"; addBtn.innerText="Add to Cart";
        addBtn.addEventListener("click",()=>{
            const qty=parseInt(qtyInput.value); if(qty>p.stock){showPopup("Not enough stock!","error"); return;}
            addToCart(p.id,qty); showPopup(`${p.name} added to cart`,"success"); p.stock-=qty; renderProducts(products); if(typeof refreshCart==="function")refreshCart();
        });
        qtyRow.appendChild(addBtn); card.appendChild(qtyRow);
        productsGrid.appendChild(card);
    });
}

function filterProducts(){
    let filtered=[...DB.products];
    const keyword=searchInput.value.toLowerCase();
    if(keyword) filtered=filtered.filter(p=>p.name.toLowerCase().includes(keyword));
    const category=categoryFilter.value;
    if(category) filtered=filtered.filter(p=>p.category===category);
    const sortBy=sortSelect.value;
    if(sortBy==="name") filtered.sort((a,b)=>a.name.localeCompare(b.name));
    if(sortBy==="price") filtered.sort((a,b)=>a.price-b.price);
    if(sortBy==="stock") filtered.sort((a,b)=>a.stock-b.stock);
    renderProducts(filtered);
}

/* =========================
   CART UI
========================= */
const cartList=document.getElementById("cartList");
const subtotalEl=document.getElementById("subtotal");
const discountEl=document.getElementById("discount");
const taxEl=document.getElementById("tax");
const totalEl=document.getElementById("total");
const checkoutBtn=document.getElementById("checkoutBtn");
const paymentMethodEl=document.getElementById("paymentMethod");

function initCart(){
    refreshCart();
    checkoutBtn.addEventListener("click",()=>{
        if(DB.cart.length===0){showPopup("Cart is empty!","error"); return;}
        const invoice=generateInvoice(); saveInvoice(invoice);
        invoice.items.forEach(item=>{ const prod=getProduct(item.id); if(prod){prod.stock-=item.qty;} });
        saveProducts(); clearCart(); refreshCart(); if(typeof renderProducts==="function") renderProducts(DB.products);
        showPopup(`Invoice #${invoice.id} generated`,"success");
        if(typeof printInvoice==="function") printInvoice(invoice);
    });
}

function refreshCart(){
    cartList.innerHTML="";
    if(DB.cart.length===0){ cartList.innerHTML="<p>Your cart is empty.</p>"; subtotalEl.innerText="0.00"; discountEl.innerText="0.00"; taxEl.innerText="0.00"; totalEl.innerText="0.00"; return;}
    let subtotal=0; const taxRate=DB.settings.taxRate||0; const discount=0;
    DB.cart.forEach(item=>{
        const product=getProduct(item.id); if(!product) return;
        const row=document.createElement("div"); row.className="cart-item"; row.style.display="flex"; row.style.justifyContent="space-between"; row.style.alignItems="center"; row.style.marginBottom="8px";
        const name=document.createElement("span"); name.innerText=`${product.name} (${DB.settings.currency} ${money(product.price)})`; row.appendChild(name);
        const qtyInput=document.createElement("input"); qtyInput.type="number"; qtyInput.value=item.qty; qtyInput.min=1; qtyInput.max=product.stock+item.qty; qtyInput.style.width="60px";
        qtyInput.addEventListener("change",()=>{ const newQty=parseInt(qtyInput.value); if(newQty>product.stock+item.qty){showPopup("Not enough stock!","error"); qtyInput.value=item.qty; return;} updateCart(item.id,newQty); refreshCart(); });
        row.appendChild(qtyInput);
        const removeBtn=document.createElement("button"); removeBtn.className="btn"; removeBtn.innerText="Remove"; removeBtn.style.marginLeft="8px"; removeBtn.addEventListener("click",()=>{ removeFromCart(item.id); refreshCart(); });
        row.appendChild(removeBtn);
        cartList.appendChild(row); subtotal+=product.price*item.qty;
    });
    const tax=subtotal*(taxRate/100); const total=subtotal-discount+tax;
    subtotalEl.innerText=money(subtotal); discountEl.innerText=money(discount); taxEl.innerText=money(tax); totalEl.innerText=money(total);
}

function generateInvoice(){
    const invoiceItems=DB.cart.map(item=>{ const product=getProduct(item.id); return {id:product.id,name:product.name,price:product.price,qty:item.qty,total:product.price*item.qty}; });
    const subtotal=invoiceItems.reduce((sum,i)=>sum+i.total,0); const tax=subtotal*(DB.settings.taxRate/100); const discount=0; const total=subtotal-discount+tax;
    return { id:uid(), date:today(), items:invoiceItems, subtotal, discount, tax, total, paymentMethod:paymentMethodEl.value||"Cash" };
}

/* =========================
   ADMIN PANEL
========================= */
const adminProductList=document.getElementById("adminProductList");
const addProductForm=document.getElementById("addProductForm");
const adminCategorySelect=document.getElementById("adminCategorySelect");
const settingsForm=document.getElementById("settingsForm");

function adminInit(){
    populateCategorySelect(); renderAdminProducts();
    addProductForm.addEventListener("submit",(e)=>{ e.preventDefault();
        const data={ name:addProductForm.name.value, price:parseFloat(addProductForm.price.value), stock:parseInt(addProductForm.stock.value), category:addProductForm.category.value, barcode:addProductForm.barcode.value, expiry:addProductForm.expiry.value };
        const file=addProductForm.image.files[0]; if(file){ fileToBase64(file,(base64)=>{ data.image=base64; addProduct(data); renderAdminProducts(); showPopup(`${data.name} added`,"success"); addProductForm.reset(); populateCategorySelect(); }); } else { addProduct(data); renderAdminProducts(); showPopup(`${data.name} added`,"success"); addProductForm.reset(); populateCategorySelect(); }
    });
    settingsForm.addEventListener("submit",(e)=>{ e.preventDefault(); const newSettings={storeName:settingsForm.storeName.value,taxRate:parseFloat(settingsForm.taxRate.value),currency:settingsForm.currency.value}; saveSettings(newSettings); showPopup("Settings saved","success"); });
}

function renderAdminProducts(){
    adminProductList.innerHTML="";
    DB.products.forEach(p=>{
        const div=document.createElement("div"); div.className="admin-product";
        const name=document.createElement("div"); name.innerText=`${p.name} (${DB.settings.currency} ${money(p.price)})`; name.style.fontWeight="bold"; div.appendChild(name);
        const category=document.createElement("div"); category.innerText=`Category: ${p.category}`; div.appendChild(category);
        const stock=document.createElement("div"); stock.innerText=`Stock: ${p.stock}`; div.appendChild(stock);
        const editBtn=document.createElement("button"); editBtn.className="btn"; editBtn.innerText="Edit"; editBtn.addEventListener("click",()=>editProductPrompt(p.id)); div.appendChild(editBtn);
        const delBtn=document.createElement("button"); delBtn.className="btn"; delBtn.innerText="Delete"; delBtn.style.marginLeft="8px"; delBtn.addEventListener("click",()=>{ if(confirm(`Delete ${p.name}?`)){ deleteProduct(p.id); renderAdminProducts(); showPopup(`${p.name} deleted`,"success"); } }); div.appendChild(delBtn);
        adminProductList.appendChild(div);
    });
}

function editProductPrompt(id){
    const p=getProduct(id); if(!p) return;
    const newName=prompt("Product Name:",p.name)||p.name;
    const newPrice=parseFloat(prompt("Price:",p.price))||p.price;
    const newStock=parseInt(prompt("Stock:",p.stock))||p.stock;
    const newCategory=prompt("Category:",p.category)||p.category;
    const newBarcode=prompt("Barcode:",p.barcode)||p.barcode;
    const newExpiry=prompt("Expiry:",p.expiry)||p.expiry;
    updateProduct(id,{name:newName,price:newPrice,stock:newStock,category:newCategory,barcode:newBarcode,expiry:newExpiry});
    renderAdminProducts(); showPopup(`${newName} updated`,"success");
}

function populateCategorySelect(){
    adminCategorySelect.innerHTML="";
    DB.categories.forEach(cat=>{ const opt=document.createElement("option"); opt.value=cat; opt.innerText=cat; adminCategorySelect.appendChild(opt); });
}

/* =========================
   INVOICE PRINTING
========================= */
const invoiceContainer=document.getElementById("invoiceContainer");

function printInvoice(invoice){
    if(!invoice) return;
    invoiceContainer.innerHTML="";
    const div=document.createElement("div"); div.className="invoice";
    const title=document.createElement("h2"); title.innerText=`${DB.settings.storeName} Invoice`; title.style.textAlign="center"; div.appendChild(title);
    const idEl=document.createElement("p"); idEl.innerText=`Invoice ID: ${invoice.id}`; div.appendChild(idEl);
    const dateEl=document.createElement("p"); dateEl.innerText=`Date: ${invoice.date}`; div.appendChild(dateEl);
    const methodEl=document.createElement("p"); methodEl.innerText=`Payment Method: ${invoice.paymentMethod}`; div.appendChild(methodEl);
    const table=document.createElement("table"); table.style.width="100%"; table.style.borderCollapse="collapse";
    const thead=document.createElement("thead"); thead.innerHTML=`<tr><th style="border-bottom:1px solid #000;text-align:left;">Item</th><th style="border-bottom:1px solid #000;">Qty</th><th style="border-bottom:1px solid #000;">Price</th><th style="border-bottom:1px solid #000;">Total</th></tr>`; table.appendChild(thead);
    const tbody=document.createElement("tbody"); invoice.items.forEach(i=>{ const tr=document.createElement("tr"); tr.innerHTML=`<td>${i.name}</td><td style="text-align:center;">${i.qty}</td><td style="text-align:right;">${DB.settings.currency} ${money(i.price)}</td><td style="text-align:right;">${DB.settings.currency} ${money(i.total)}</td>`; tbody.appendChild(tr); }); table.appendChild(tbody); div.appendChild(table);
    const totalsDiv=document.createElement("div"); totalsDiv.style.textAlign="right"; totalsDiv.style.marginTop="10px"; totalsDiv.innerHTML=`<p>Subtotal: ${DB.settings.currency} ${money(invoice.subtotal)}</p><p>Tax (${DB.settings.taxRate}%): ${DB.settings.currency} ${money(invoice.tax)}</p><p>Discount: ${DB.settings.currency} ${money(invoice.discount)}</p><h3>Total: ${DB.settings.currency} ${money(invoice.total)}</h3>`; div.appendChild(totalsDiv);
    invoiceContainer.appendChild(div);
    const printWindow=window.open('','PRINT','height=600,width=800');
    printWindow.document.write('<html><head><title>Invoice</title>');
    printWindow.document.write('<style>body{font-family:sans-serif;}table{width:100%;border-collapse:collapse;}th,td{padding:6px;border:1px solid #000;}</style>');
    printWindow.document.write('</head><body >'); printWindow.document.write(div.innerHTML); printWindow.document.write('</body></html>'); printWindow.document.close(); printWindow.focus(); printWindow.print(); printWindow.close();
}

function regenerateInvoice(id){
    const invoice=DB.invoices.find(inv=>inv.id===id);
    if(!invoice){ showPopup("Invoice not found","error"); return; }
    printInvoice(invoice);
}

/* =========================
   INIT ALL
========================= */
function initSupermarket(){
    loadProducts();
    initCart();
    adminInit();
}

document.addEventListener("DOMContentLoaded",initSupermarket);
