/* ===================== SAMPLE DATA ===================== */
const PRODUCTS = [
  { id:1, brand:"Lenovo", name:"Lenovo Legion 5 Pro 2024", tag:"Gaming", cpu:"Ryzen 7 7745HX", ram:16, ssd:"512GB SSD", gpu:"RTX 4060 8GB", screen:"16\" QHD 165Hz", price:28990000, oldPrice:32990000, rating:4.8, reviews:214, sold:512, badge:"sale", stock:true, hue:255 },
  { id:2, brand:"Asus", name:"Asus ROG Strix G16", tag:"Gaming", cpu:"Core i7-13650HX", ram:16, ssd:"1TB SSD", gpu:"RTX 4070 8GB", screen:"16\" QHD+ 240Hz", price:38990000, oldPrice:42990000, rating:4.7, reviews:156, sold:301, badge:"hot", stock:true, hue:265 },
  { id:3, brand:"Dell", name:"Dell XPS 13 Plus", tag:"Mỏng nhẹ", cpu:"Core i7-1360P", ram:16, ssd:"512GB SSD", gpu:"Intel Iris Xe", screen:"13.4\" OLED", price:34990000, oldPrice:0, rating:4.6, reviews:98, sold:120, badge:"new", stock:true, hue:210 },
  { id:4, brand:"HP", name:"HP Pavilion 15", tag:"Văn phòng", cpu:"Core i5-1335U", ram:8, ssd:"512GB SSD", gpu:"Intel UHD", screen:"15.6\" FHD", price:15990000, oldPrice:17990000, rating:4.3, reviews:342, sold:820, badge:"sale", stock:true, hue:190 },
  { id:5, brand:"Acer", name:"Acer Aspire 7", tag:"Sinh viên", cpu:"Ryzen 5 7535HS", ram:16, ssd:"512GB SSD", gpu:"RTX 2050", screen:"15.6\" FHD 144Hz", price:17490000, oldPrice:0, rating:4.4, reviews:180, sold:410, badge:"", stock:true, hue:150 },
  { id:6, brand:"MSI", name:"MSI Katana 15", tag:"Gaming", cpu:"Core i7-13620H", ram:16, ssd:"1TB SSD", gpu:"RTX 4060 8GB", screen:"15.6\" FHD 144Hz", price:26990000, oldPrice:29990000, rating:4.6, reviews:132, sold:265, badge:"sale", stock:true, hue:340 },
  { id:7, brand:"Apple", name:"MacBook Air M3", tag:"Mỏng nhẹ", cpu:"Apple M3", ram:16, ssd:"512GB SSD", gpu:"GPU 10 nhân", screen:"13.6\" Liquid Retina", price:32990000, oldPrice:0, rating:4.9, reviews:410, sold:980, badge:"hot", stock:true, hue:30 },
  { id:8, brand:"Lenovo", name:"Lenovo ThinkBook 14 G6", tag:"Văn phòng", cpu:"Core i5-13500H", ram:16, ssd:"512GB SSD", gpu:"Intel Iris Xe", screen:"14\" WUXGA", price:19490000, oldPrice:0, rating:4.5, reviews:88, sold:190, badge:"new", stock:true, hue:255 },
  { id:9, brand:"Asus", name:"Asus Vivobook Pro 15 OLED", tag:"Đồ họa", cpu:"Ryzen 7 7735HS", ram:16, ssd:"512GB SSD", gpu:"RTX 3050", screen:"15.6\" 2.8K OLED", price:21990000, oldPrice:24990000, rating:4.6, reviews:145, sold:230, badge:"sale", stock:true, hue:265 },
  { id:10, brand:"Dell", name:"Dell Inspiron 16 Plus", tag:"Đồ họa", cpu:"Core i7-13700H", ram:16, ssd:"1TB SSD", gpu:"RTX 4050", screen:"16\" QHD+", price:29990000, oldPrice:0, rating:4.5, reviews:76, sold:99, badge:"", stock:false, hue:210 },
  { id:11, brand:"HP", name:"HP Omen 16", tag:"Gaming", cpu:"Core i9-13900HX", ram:32, ssd:"1TB SSD", gpu:"RTX 4080 12GB", screen:"16\" QHD+ 240Hz", price:52990000, oldPrice:57990000, rating:4.8, reviews:64, sold:52, badge:"sale", stock:true, hue:190 },
  { id:12, brand:"Acer", name:"Acer Swift Go 14", tag:"Mỏng nhẹ", cpu:"Core Ultra 5 125H", ram:16, ssd:"512GB SSD", gpu:"Intel Arc", screen:"14\" 2.8K OLED", price:22990000, oldPrice:0, rating:4.4, reviews:52, sold:70, badge:"new", stock:true, hue:150 },
  { id:13, brand:"MSI", name:"MSI Modern 14", tag:"Văn phòng", cpu:"Core i5-1235U", ram:8, ssd:"512GB SSD", gpu:"Intel Iris Xe", screen:"14\" FHD", price:13990000, oldPrice:15490000, rating:4.2, reviews:210, sold:530, badge:"sale", stock:true, hue:340 },
  { id:14, brand:"Apple", name:"MacBook Pro 14 M3 Pro", tag:"Đồ họa", cpu:"Apple M3 Pro", ram:18, ssd:"512GB SSD", gpu:"GPU 14 nhân", screen:"14.2\" Liquid Retina XDR", price:52990000, oldPrice:0, rating:4.9, reviews:301, sold:410, badge:"hot", stock:true, hue:30 },
  { id:15, brand:"Lenovo", name:"Lenovo IdeaPad Slim 5", tag:"Sinh viên", cpu:"Ryzen 5 7530U", ram:16, ssd:"512GB SSD", gpu:"AMD Radeon", screen:"14\" 2.2K", price:14990000, oldPrice:16490000, rating:4.3, reviews:167, sold:390, badge:"sale", stock:true, hue:255 },
  { id:16, brand:"Asus", name:"Asus TUF Gaming A15", tag:"Gaming", cpu:"Ryzen 7 7735HS", ram:16, ssd:"512GB SSD", gpu:"RTX 4050", screen:"15.6\" FHD 144Hz", price:23990000, oldPrice:0, rating:4.5, reviews:190, sold:340, badge:"", stock:true, hue:265 },
  { id:17, brand:"Dell", name:"Dell Latitude 5440", tag:"Văn phòng", cpu:"Core i5-1335U", ram:16, ssd:"512GB SSD", gpu:"Intel Iris Xe", screen:"14\" FHD", price:20990000, oldPrice:0, rating:4.4, reviews:44, sold:60, badge:"new", stock:true, hue:210 },
  { id:18, brand:"HP", name:"HP Victus 16", tag:"Gaming", cpu:"Core i5-13500H", ram:16, ssd:"512GB SSD", gpu:"RTX 4050", screen:"16.1\" FHD 144Hz", price:22990000, oldPrice:25990000, rating:4.5, reviews:120, sold:220, badge:"sale", stock:true, hue:190 },
  { id:19, brand:"Acer", name:"Acer Nitro 5", tag:"Gaming", cpu:"Core i5-12500H", ram:8, ssd:"512GB SSD", gpu:"RTX 3050", screen:"15.6\" FHD 144Hz", price:16990000, oldPrice:18990000, rating:4.1, reviews:280, sold:610, badge:"sale", stock:false, hue:150 },
  { id:20, brand:"MSI", name:"MSI Creator Z16", tag:"Đồ họa", cpu:"Core i7-13700H", ram:32, ssd:"1TB SSD", gpu:"RTX 4060 8GB", screen:"16\" QHD+ 165Hz", price:45990000, oldPrice:0, rating:4.6, reviews:38, sold:41, badge:"", stock:true, hue:340 },
  { id:21, brand:"Apple", name:"MacBook Air M2", tag:"Mỏng nhẹ", cpu:"Apple M2", ram:8, ssd:"256GB SSD", gpu:"GPU 8 nhân", screen:"13.6\" Liquid Retina", price:24990000, oldPrice:27990000, rating:4.7, reviews:520, sold:1200, badge:"sale", stock:true, hue:30 },
  { id:22, brand:"Lenovo", name:"Lenovo Yoga Slim 7x", tag:"Mỏng nhẹ", cpu:"Snapdragon X Elite", ram:16, ssd:"1TB SSD", gpu:"Adreno GPU", screen:"14.5\" 3K OLED", price:27990000, oldPrice:0, rating:4.5, reviews:29, sold:33, badge:"new", stock:true, hue:255 },
  { id:23, brand:"Asus", name:"Asus Zenbook 14 OLED", tag:"Mỏng nhẹ", cpu:"Core Ultra 7 155H", ram:16, ssd:"1TB SSD", gpu:"Intel Arc", screen:"14\" 2.8K OLED", price:28990000, oldPrice:31990000, rating:4.7, reviews:91, sold:140, badge:"sale", stock:true, hue:265 },
  { id:24, brand:"Dell", name:"Dell Alienware m16", tag:"Gaming", cpu:"Core i9-13900HX", ram:32, ssd:"1TB SSD", gpu:"RTX 4090 16GB", screen:"16\" QHD+ 240Hz", price:69990000, oldPrice:0, rating:4.9, reviews:22, sold:18, badge:"hot", stock:true, hue:210 },
  { id:25, brand:"HP", name:"HP EliteBook 840 G10", tag:"Văn phòng", cpu:"Core i7-1355U", ram:16, ssd:"512GB SSD", gpu:"Intel Iris Xe", screen:"14\" WUXGA", price:31990000, oldPrice:0, rating:4.6, reviews:35, sold:47, badge:"", stock:true, hue:190 },
  { id:26, brand:"MSI", name:"MSI Cyborg 15", tag:"Gaming", cpu:"Core i5-13420H", ram:8, ssd:"512GB SSD", gpu:"RTX 4050", screen:"15.6\" FHD 144Hz", price:19990000, oldPrice:21990000, rating:4.3, reviews:98, sold:175, badge:"sale", stock:true, hue:340 },
];

/* ===================== STATE ===================== */
const state = {
  page: 1,
  perPage: 8,
  sort: "popular",
  view: "grid",
  brands: new Set(),
  tags: new Set(),
  rams: new Set(),
  priceRange: null,
  wishlist: new Set(),
  cart: new Map(), // id -> qty
};

/* ===================== HELPERS ===================== */
const vnd = n => n.toLocaleString("vi-VN") + "₫";

function thumbSVG(hue, small){
  const s = small ? 60 : 100;
  return `<svg viewBox="0 0 100 100" style="background:linear-gradient(135deg,hsl(${hue} 70% 94%),hsl(${hue} 80% 86%))">
    <rect x="20" y="30" width="60" height="38" rx="4" fill="hsl(${hue} 45% 32%)"/>
    <rect x="24" y="34" width="52" height="28" rx="2" fill="hsl(${hue} 60% 88%)"/>
    <rect x="14" y="68" width="72" height="7" rx="3" fill="hsl(${hue} 45% 26%)"/>
  </svg>`;
}

function badgeHTML(p){
  if(!p.stock) return `<span class="badge-ribbon badge-out">Hết hàng</span>`;
  if(p.badge === "sale") return `<span class="badge-ribbon badge-sale">Giảm giá</span>`;
  if(p.badge === "new") return `<span class="badge-ribbon badge-new">Mới</span>`;
  if(p.badge === "hot") return `<span class="badge-ribbon badge-hot">Bán chạy</span>`;
  return "";
}

function starsHTML(rating){
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5-full);
}

function productCard(p){
  const off = p.oldPrice ? Math.round((1 - p.price/p.oldPrice)*100) : 0;
  const wished = state.wishlist.has(p.id) ? "active" : "";
  return `
  <div class="product-card ${!p.stock ? "out-of-stock":""}" data-id="${p.id}">
    <div class="product-thumb">
      ${badgeHTML(p)}
      <button class="wish-toggle ${wished}" data-wish="${p.id}">♥</button>
      ${thumbSVG(p.hue)}
    </div>
    <div class="product-body">
      <span class="product-brand">${p.brand} · ${p.tag}</span>
      <h3 class="product-name">${p.name}</h3>
      <span class="product-specs">${p.cpu} · ${p.ram}GB RAM · ${p.ssd}</span>
      <div class="product-rating"><span class="stars">${starsHTML(p.rating)}</span> ${p.rating} (${p.reviews})</div>
      <div class="product-price">
        <span class="price-now">${vnd(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${vnd(p.oldPrice)}</span><span class="price-off">-${off}%</span>` : ""}
      </div>
    </div>
    <div class="product-actions">
      <button class="btn btn-outline" data-quickview="${p.id}">Xem nhanh</button>
      <button class="btn btn-primary" data-addcart="${p.id}" ${!p.stock ? "disabled":""}>Thêm giỏ</button>
    </div>
  </div>`;
}

/* ===================== FILTER + SORT + PAGINATE ===================== */
function priceInRange(price, range){
  if(!range) return true;
  const [min,max] = range.split("-").map(Number);
  return price/1000000 >= min && price/1000000 < max;
}

function getFiltered(){
  return PRODUCTS.filter(p=>{
    if(state.brands.size && !state.brands.has(p.brand)) return false;
    if(state.tags.size && !state.tags.has(p.tag)) return false;
    if(state.rams.size && !state.rams.has(String(p.ram))) return false;
    if(!priceInRange(p.price, state.priceRange)) return false;
    return true;
  });
}

function getSorted(list){
  const arr = [...list];
  switch(state.sort){
    case "price-asc": arr.sort((a,b)=>a.price-b.price); break;
    case "price-desc": arr.sort((a,b)=>b.price-a.price); break;
    case "rating": arr.sort((a,b)=>b.rating-a.rating); break;
    case "newest": arr.sort((a,b)=>b.id-a.id); break;
    default: arr.sort((a,b)=>b.sold-a.sold);
  }
  return arr;
}

function renderGrid(){
  const filtered = getSorted(getFiltered());
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page-1)*state.perPage;
  const pageItems = filtered.slice(start, start+state.perPage);

  const grid = document.getElementById("productGrid");
  grid.className = "product-grid" + (state.view === "list" ? " list-view":"");
  grid.innerHTML = pageItems.length
    ? pageItems.map(productCard).join("")
    : `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">Không tìm thấy sản phẩm phù hợp bộ lọc.</p>`;

  document.getElementById("resultCount").textContent = filtered.length
    ? `Hiển thị ${start+1}–${Math.min(start+state.perPage, filtered.length)} trong ${filtered.length} sản phẩm`
    : `0 sản phẩm phù hợp`;

  renderPagination(totalPages);
}

function renderPagination(totalPages){
  const el = document.getElementById("pagination");
  let html = `<button ${state.page===1?"disabled":""} data-page="${state.page-1}">‹</button>`;
  for(let i=1;i<=totalPages;i++){
    html += `<button class="${i===state.page?"active":""}" data-page="${i}">${i}</button>`;
  }
  html += `<button ${state.page===totalPages?"disabled":""} data-page="${state.page+1}">›</button>`;
  el.innerHTML = html;
}

document.getElementById("pagination").addEventListener("click", e=>{
  const btn = e.target.closest("button[data-page]");
  if(!btn || btn.disabled) return;
  state.page = Number(btn.dataset.page);
  renderGrid();
  document.getElementById("products").scrollIntoView({behavior:"smooth", block:"start"});
});

/* ===================== FILTER EVENTS ===================== */
document.querySelectorAll(".f-brand").forEach(cb=>cb.addEventListener("change",()=>{
  cb.checked ? state.brands.add(cb.value) : state.brands.delete(cb.value);
  state.page = 1; renderGrid();
}));
document.querySelectorAll(".f-tag").forEach(cb=>cb.addEventListener("change",()=>{
  cb.checked ? state.tags.add(cb.value) : state.tags.delete(cb.value);
  state.page = 1; renderGrid();
}));
document.querySelectorAll(".f-ram").forEach(cb=>cb.addEventListener("change",()=>{
  cb.checked ? state.rams.add(cb.value) : state.rams.delete(cb.value);
  state.page = 1; renderGrid();
}));
document.querySelectorAll(".f-price").forEach(r=>r.addEventListener("change",()=>{
  state.priceRange = r.value; state.page = 1; renderGrid();
}));
document.getElementById("clearFilters").addEventListener("click",()=>{
  state.brands.clear(); state.tags.clear(); state.rams.clear(); state.priceRange = null;
  document.querySelectorAll(".f-brand,.f-tag,.f-ram").forEach(cb=>cb.checked=false);
  document.querySelectorAll(".f-price").forEach(r=>r.checked=false);
  state.page = 1; renderGrid();
});
document.getElementById("sortSelect").addEventListener("change", e=>{
  state.sort = e.target.value; state.page = 1; renderGrid();
});
document.getElementById("viewGrid").addEventListener("click", ()=>{
  state.view="grid";
  document.getElementById("viewGrid").classList.add("active");
  document.getElementById("viewList").classList.remove("active");
  renderGrid();
});
document.getElementById("viewList").addEventListener("click", ()=>{
  state.view="list";
  document.getElementById("viewList").classList.add("active");
  document.getElementById("viewGrid").classList.remove("active");
  renderGrid();
});

/* ===================== WISHLIST + CART (event delegation) ===================== */
function updateBadges(){
  document.getElementById("wishlistCount").textContent = state.wishlist.size;
  let qty = 0; state.cart.forEach(v=>qty+=v);
  document.getElementById("cartCount").textContent = qty;
}

function toggleWish(id){
  state.wishlist.has(id) ? state.wishlist.delete(id) : state.wishlist.add(id);
  updateBadges();
  document.querySelectorAll(`[data-wish="${id}"]`).forEach(btn=>btn.classList.toggle("active", state.wishlist.has(id)));
}

function addToCart(id, qty=1){
  state.cart.set(id, (state.cart.get(id)||0) + qty);
  updateBadges();
  renderCart();
  openCart();
}

function renderCart(){
  const wrap = document.getElementById("cartItems");
  if(state.cart.size === 0){
    wrap.innerHTML = `<div class="cart-empty">🛒 Giỏ hàng của bạn đang trống</div>`;
    document.getElementById("cartSubtotal").textContent = vnd(0);
    return;
  }
  let subtotal = 0;
  let html = "";
  state.cart.forEach((qty,id)=>{
    const p = PRODUCTS.find(x=>x.id===id);
    subtotal += p.price*qty;
    html += `
    <div class="cart-item" data-id="${p.id}">
      <div class="product-thumb">${thumbSVG(p.hue,true)}</div>
      <div class="cart-item-info">
        <h5>${p.name}</h5>
        <span class="price-now">${vnd(p.price)}</span>
        <div class="qty-row">
          <button data-qty="-1">−</button>
          <span>${qty}</span>
          <button data-qty="1">+</button>
          <button class="remove-item" data-remove>Xóa</button>
        </div>
      </div>
    </div>`;
  });
  wrap.innerHTML = html;
  document.getElementById("cartSubtotal").textContent = vnd(subtotal);
}

document.addEventListener("click", e=>{
  const wishBtn = e.target.closest("[data-wish]");
  if(wishBtn){ toggleWish(Number(wishBtn.dataset.wish)); return; }

  const addBtn = e.target.closest("[data-addcart]");
  if(addBtn){ addToCart(Number(addBtn.dataset.addcart)); return; }

  const qvBtn = e.target.closest("[data-quickview]");
  if(qvBtn){ openQuickView(Number(qvBtn.dataset.quickview)); return; }

  const cartItem = e.target.closest(".cart-item");
  if(cartItem){
    const id = Number(cartItem.dataset.id);
    if(e.target.closest("[data-remove]")){
      state.cart.delete(id); updateBadges(); renderCart(); return;
    }
    const qtyBtn = e.target.closest("[data-qty]");
    if(qtyBtn){
      const delta = Number(qtyBtn.dataset.qty);
      const next = (state.cart.get(id)||0) + delta;
      next <= 0 ? state.cart.delete(id) : state.cart.set(id, Math.min(next,10));
      updateBadges(); renderCart(); return;
    }
  }
});

/* ===================== CART DRAWER ===================== */
const overlay = document.getElementById("overlay");
const cartDrawer = document.getElementById("cartDrawer");
function openCart(){ cartDrawer.classList.add("open"); overlay.classList.add("open"); }
function closeCart(){ cartDrawer.classList.remove("open"); overlay.classList.remove("open"); }
document.getElementById("cartBtn").addEventListener("click", ()=>{ renderCart(); openCart(); });
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("continueShopping").addEventListener("click", closeCart);
overlay.addEventListener("click", ()=>{ closeCart(); closeAllDropdowns(); });

/* ===================== QUICK VIEW MODAL ===================== */
const qvOverlay = document.getElementById("quickViewOverlay");
function openQuickView(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const off = p.oldPrice ? Math.round((1 - p.price/p.oldPrice)*100) : 0;
  document.getElementById("quickViewBox").innerHTML = `
    <button class="modal-close" id="qvClose">✕</button>
    <div class="modal-thumb"><div class="product-thumb">${badgeHTML(p)}${thumbSVG(p.hue)}</div></div>
    <div class="modal-info">
      <span class="product-brand">${p.brand} · ${p.tag}</span>
      <h2>${p.name}</h2>
      <div class="product-rating"><span class="stars">${starsHTML(p.rating)}</span> ${p.rating} (${p.reviews} đánh giá) · Đã bán ${p.sold}</div>
      <ul class="spec-list">
        <li>CPU: ${p.cpu}</li>
        <li>RAM: ${p.ram}GB</li>
        <li>Ổ cứng: ${p.ssd}</li>
        <li>Card đồ họa: ${p.gpu}</li>
        <li>Màn hình: ${p.screen}</li>
      </ul>
      <div class="product-price">
        <span class="price-now">${vnd(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${vnd(p.oldPrice)}</span><span class="price-off">-${off}%</span>` : ""}
      </div>
      <div class="modal-qty">
        <button id="qvMinus">−</button><span id="qvQty">1</span><button id="qvPlus">+</button>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-wish="${p.id}">${state.wishlist.has(p.id) ? "♥ Đã thích":"♡ Yêu thích"}</button>
        <button class="btn btn-primary btn-block" id="qvAddCart" ${!p.stock?"disabled":""}>${p.stock ? "Thêm vào giỏ":"Hết hàng"}</button>
      </div>
    </div>`;
  qvOverlay.classList.add("open");
  let qty = 1;
  document.getElementById("qvMinus").onclick = ()=>{ qty=Math.max(1,qty-1); document.getElementById("qvQty").textContent=qty; };
  document.getElementById("qvPlus").onclick = ()=>{ qty=Math.min(10,qty+1); document.getElementById("qvQty").textContent=qty; };
  document.getElementById("qvAddCart").onclick = ()=>{ addToCart(p.id, qty); qvOverlay.classList.remove("open"); };
  document.getElementById("qvClose").onclick = ()=> qvOverlay.classList.remove("open");
}
qvOverlay.addEventListener("click", e=>{ if(e.target === qvOverlay) qvOverlay.classList.remove("open"); });

/* ===================== FLASH SALE + RECOMMENDATION TRACKS ===================== */
function smallCard(p){ return productCard(p); }
document.getElementById("flashTrack").innerHTML = PRODUCTS.filter(p=>p.oldPrice).slice(0,10).map(smallCard).join("");
document.getElementById("recoTrack").innerHTML = [...PRODUCTS].sort((a,b)=>b.rating-a.rating).slice(0,10).map(smallCard).join("");
document.getElementById("viewedTrack").innerHTML = PRODUCTS.slice(6,16).map(smallCard).join("");

document.querySelectorAll(".carousel-nav button").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const track = document.getElementById(btn.dataset.target);
    track.scrollBy({left: Number(btn.dataset.dir)*280, behavior:"smooth"});
  });
});

/* ===================== HERO SLIDER ===================== */
const slides = document.querySelectorAll(".hero-slide");
const dotsWrap = document.getElementById("heroDots");
let heroIndex = 0;
slides.forEach((_,i)=>{
  const dot = document.createElement("span");
  if(i===0) dot.classList.add("active");
  dot.addEventListener("click", ()=>showSlide(i));
  dotsWrap.appendChild(dot);
});
function showSlide(i){
  slides[heroIndex].classList.remove("active");
  dotsWrap.children[heroIndex].classList.remove("active");
  heroIndex = (i+slides.length)%slides.length;
  slides[heroIndex].classList.add("active");
  dotsWrap.children[heroIndex].classList.add("active");
}
document.getElementById("heroPrev").addEventListener("click", ()=>showSlide(heroIndex-1));
document.getElementById("heroNext").addEventListener("click", ()=>showSlide(heroIndex+1));
setInterval(()=>showSlide(heroIndex+1), 6000);

/* ===================== COUNTDOWN ===================== */
let countdownTarget = Date.now() + (6*3600 + 23*60)*1000;
function tickCountdown(){
  let diff = Math.max(0, countdownTarget - Date.now());
  const h = String(Math.floor(diff/3600000)).padStart(2,"0");
  const m = String(Math.floor((diff%3600000)/60000)).padStart(2,"0");
  const s = String(Math.floor((diff%60000)/1000)).padStart(2,"0");
  document.getElementById("cdH").textContent = h;
  document.getElementById("cdM").textContent = m;
  document.getElementById("cdS").textContent = s;
  if(diff <= 0) countdownTarget = Date.now() + 6*3600*1000;
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ===================== NAV DROPDOWNS ===================== */
function closeAllDropdowns(){
  document.querySelectorAll(".has-mega.open, .has-dropdown.open").forEach(el=>el.classList.remove("open"));
  document.querySelectorAll(".dropdown-menu.open").forEach(el=>el.classList.remove("open"));
}
document.querySelectorAll(".has-mega, .has-dropdown").forEach(item=>{
  item.querySelector(".nav-trigger").addEventListener("click", e=>{
    const isOpen = item.classList.contains("open");
    closeAllDropdowns();
    if(!isOpen) item.classList.add("open");
  });
});
document.getElementById("accountBtn").addEventListener("click", ()=>{
  const menu = document.getElementById("accountMenu");
  const isOpen = menu.classList.contains("open");
  closeAllDropdowns();
  if(!isOpen) menu.classList.add("open");
});
document.addEventListener("click", e=>{
  if(!e.target.closest(".has-mega") && !e.target.closest(".has-dropdown") && !e.target.closest(".dropdown-wrap")){
    closeAllDropdowns();
  }
});

/* ===================== MOBILE MENU ===================== */
document.getElementById("hamburgerBtn").addEventListener("click", ()=>{
  document.getElementById("navbar").classList.toggle("mobile-open");
});

/* ===================== SEARCH SUGGESTIONS ===================== */
const searchInput = document.getElementById("searchInput");
const searchSuggest = document.getElementById("searchSuggest");
searchInput.addEventListener("input", ()=>{
  const q = searchInput.value.trim().toLowerCase();
  if(!q){ searchSuggest.classList.remove("open"); return; }
  const matches = PRODUCTS.filter(p=>p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0,6);
  searchSuggest.innerHTML = matches.length
    ? matches.map(p=>`<a href="#products" data-goto="${p.id}"><span>${p.name}</span><small>${vnd(p.price)}</small></a>`).join("")
    : `<a><span>Không tìm thấy sản phẩm khớp "${searchInput.value}"</span></a>`;
  searchSuggest.classList.add("open");
});
document.addEventListener("click", e=>{
  if(!e.target.closest(".search-box")) searchSuggest.classList.remove("open");
});
searchSuggest.addEventListener("click", e=>{
  const a = e.target.closest("[data-goto]");
  if(a) openQuickView(Number(a.dataset.goto));
  searchSuggest.classList.remove("open");
});

/* ===================== AI ASSISTANT WIDGET ===================== */
const aiPanel = document.getElementById("aiPanel");
function openAi(){ aiPanel.classList.add("open"); }
document.getElementById("aiFab").addEventListener("click", ()=> aiPanel.classList.toggle("open"));
document.getElementById("closeAi").addEventListener("click", ()=> aiPanel.classList.remove("open"));
document.getElementById("assistantHeaderBtn").addEventListener("click", openAi);
document.getElementById("heroAiBtn").addEventListener("click", e=>{ e.preventDefault(); openAi(); });
document.getElementById("filterAiBtn").addEventListener("click", openAi);

document.getElementById("aiForm").addEventListener("submit", e=>{
  e.preventDefault();
  const input = document.getElementById("aiInput");
  const text = input.value.trim();
  if(!text) return;
  const msgs = document.getElementById("aiMessages");
  msgs.insertAdjacentHTML("beforeend", `<div class="ai-msg user">${text}</div>`);
  input.value = "";
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(()=>{
    msgs.insertAdjacentHTML("beforeend", `<div class="ai-msg bot">Đây là bản demo giao diện tĩnh nên mình chưa thể phân tích câu hỏi thật — ở bản đầy đủ, AI sẽ đọc dữ liệu tồn kho và giá thực tế để gợi ý sản phẩm phù hợp nhất.</div>`);
    msgs.scrollTop = msgs.scrollHeight;
  }, 500);
});

/* ===================== NEWSLETTER (demo only) ===================== */
document.getElementById("newsletterForm").addEventListener("submit", e=>{
  e.preventDefault();
  e.target.querySelector("input").value = "";
  alert("Cảm ơn bạn đã đăng ký nhận ưu đãi từ ThinkBuy! (đây là bản demo giao diện)");
});

/* ===================== INIT ===================== */
updateBadges();
renderGrid();
