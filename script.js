// GLOBAL CONFIG
const WHATSAPP_UMKM_NUMBER = "62895385224806"; // required international format

// UTILITIES
function formatRupiah(number) {
  return "Rp" + number.toLocaleString("id-ID");
}

function getProducts() {
  // Products are defined on index.html in window.BAKERY_PRODUCTS
  if (typeof window.BAKERY_PRODUCTS !== "undefined") {
    return window.BAKERY_PRODUCTS;
  }
  // Fallback for checkout.html (must match index IDs/prices)
  return [
    { id: "Single", name: "Single CACINO", price: 8000},
    { id: "Double", name: "CACINO Hemat", price: 15000},
    { id: "Tetra", name: "CACINO Hemat X-Tra", price: 25000}
  ];
  // return [
  //   { id: "DoubleCizz", name: "Sourdough Country Loaf", price: 45000 },
  //   { id: "CROISSANT_BOX", name: "Butter Croissant Box (6 pcs)", price: 75000 },
  //   { id: "CHOCOLATE_CAKE", name: "Dark Chocolate Ganache Cake", price: 185000 },
  //   { id: "CINNAMON_ROLLS", name: "Cinnamon Rolls Tray (9 pcs)", price: 99000 },
  //   { id: "CHEESE_TART", name: "Baked Cheese Tart Box (4 pcs)", price: 88000 },
  //   { id: "COOKIES_JAR", name: "Sea Salt Choc Chip Cookies Jar", price: 65000 },
  // ];
}

function getCart() {
  try {
    const raw = localStorage.getItem("ad_bakery_cart");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem("ad_bakery_cart", JSON.stringify(cart));
}

// NAVIGATION (mobile)
function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  links.addEventListener("click", e => {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
    }
  });
}

// INDEX: render products, qty controls, Order Now buttons
function initProductCatalog() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const products = getProducts();
  const cart = getCart();

  grid.innerHTML = "";
  products.forEach(product => {
    const qty = cart[product.id] || 0;

    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image-wrapper">
        <span class="product-pill">Best Seller</span>
        <img src="${product.image}" alt="${product.name}">
      </div>
      <h3 class="product-title">${product.name}</h3>
      <p class="product-meta"></p>
      <div class="product-bottom">
        <div>
          <div class="product-price">${formatRupiah(product.price)}</div>
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <div class="product-qty" data-id="${product.id}">
            <button type="button" class="qty-decrease" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${qty}</span>
            <button type="button" class="qty-increase" aria-label="Increase quantity">+</button>
          </div>
          <a href="checkout.html" class="btn primary-btn product-order-btn" data-order-id="${product.id}">
            Order Now
          </a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Qty controls
  grid.addEventListener("click", event => {
    const target = event.target;
    const qtyWrapper = target.closest(".product-qty");
    if (!qtyWrapper) return;
    const productId = qtyWrapper.getAttribute("data-id");
    const valueNode = qtyWrapper.querySelector(".qty-value");
    let current = parseInt(valueNode.textContent || "0", 10);

    const cart = getCart();
    if (target.classList.contains("qty-increase")) {
      current += 1;
    } else if (target.classList.contains("qty-decrease")) {
      current = Math.max(0, current - 1);
    } else {
      return;
    }
    valueNode.textContent = current;

    if (current === 0) {
      delete cart[productId];
    } else {
      cart[productId] = current;
    }
    saveCart(cart);
  });

  // Order Now buttons: store product & navigate to checkout.html
  grid.addEventListener("click", event => {
    const orderBtn = event.target.closest("[data-order-id]");
    if (!orderBtn) return;

    const productId = orderBtn.getAttribute("data-order-id");
    const cart = getCart();
    if (!cart[productId] || cart[productId] < 1) {
      cart[productId] = 1; // default 1 if not set
      saveCart(cart);
    }
    // standard navigation to checkout page
    window.location.href = "checkout.html";
  });
}

// CHECKOUT: build summary from cart or fallback
function initCheckoutSummary() {
  const summaryItems = document.getElementById("summary-items");
  const subtotalEl = document.getElementById("summary-subtotal");
  const totalEl = document.getElementById("summary-total");
  if (!summaryItems || !subtotalEl || !totalEl) return;

  const products = getProducts().reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const cart = getCart();
  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);

  summaryItems.innerHTML = "";

  let subtotal = 0;

  if (cartEntries.length === 0) {
    // Fallback default if user came directly
    const defaultProduct = products["DoubleCizz"];
    const defaultQty = 1;
    subtotal = defaultProduct.price * defaultQty;

    const itemDiv = document.createElement("div");
    itemDiv.className = "summary-item";
    itemDiv.innerHTML = `
      <div>
        <div class="summary-item-name">${defaultProduct.name}</div>
        <div class="summary-item-meta">Qty 1 · ${formatRupiah(defaultProduct.price)}</div>
      </div>
      <div>${formatRupiah(subtotal)}</div>
    `;
    summaryItems.appendChild(itemDiv);

    subtotalEl.textContent = formatRupiah(subtotal);
    totalEl.textContent = formatRupiah(subtotal);
    // Save fallback cart so WA message stays consistent
    saveCart({ [defaultProduct.id]: defaultQty });
    return;
  }

  cartEntries.forEach(([productId, qty]) => {
    const product = products[productId];
    if (!product) return;
    const lineTotal = product.price * qty;
    subtotal += lineTotal;

    const itemDiv = document.createElement("div");
    itemDiv.className = "summary-item";
    itemDiv.innerHTML = `
      <div>
        <div class="summary-item-name">${product.name}</div>
        <div class="summary-item-meta">Qty ${qty} · ${formatRupiah(product.price)}</div>
      </div>
      <div>${formatRupiah(lineTotal)}</div>
    `;
    summaryItems.appendChild(itemDiv);
  });

  subtotalEl.textContent = formatRupiah(subtotal);
  totalEl.textContent = formatRupiah(subtotal);
}

// CHECKOUT: form submit -> WhatsApp click-to-chat
function initCheckoutForm() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const nameInput = document.getElementById("customerName");
  const waInput = document.getElementById("customerWhatsapp");
  const notesInput = document.getElementById("orderNotes");
  const backBtn = document.getElementById("back-to-menu");

  backBtn?.addEventListener("click", () => {
    window.location.href = "index.html#products";
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    // Simple client-side validation
    let hasError = false;
    [nameInput, waInput].forEach(input => {
      input.classList.remove("error");
      const existingError = input.parentElement.querySelector(".form-error");
      if (existingError) existingError.remove();
      if (!input.value.trim()) {
        input.classList.add("error");
        const err = document.createElement("div");
        err.className = "form-error";
        err.textContent = "This field is required.";
        input.parentElement.appendChild(err);
        hasError = true;
      }
    });

    if (hasError) {
      return;
    }

    const customerName = nameInput.value.trim();
    const customerWa = waInput.value.trim();
    const notes = notesInput.value.trim();

    const productsList = getProducts().reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
    const cart = getCart();
    const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);

    if (cartEntries.length === 0) {
      alert("Your cart is empty. Please add at least one product from the menu.");
      window.location.href = "index.html#products";
      return;
    }

    let subtotal = 0;
    const lines = cartEntries.map(([productId, qty]) => {
      const product = productsList[productId];
      if (!product) return null;
      const lineTotal = product.price * qty;
      subtotal += lineTotal;
      return `• ${product.name} (x${qty}) – ${formatRupiah(lineTotal)}`;
    }).filter(Boolean);

    const messageLines = [
      `Halo Mincau 👋`,
      "",
      `Nama Saya ${customerName}`,
      '',
      `WhatsApp: ${customerWa}`,
      "",
      "Detail Pesanan:",
      ...lines,
      "",
      `Total Estimasi: ${formatRupiah(subtotal)}`,
      "",
      notes ? `Catatan: ${notes}` : "",
      "Mohon konfirmasi ketersediaan produk dan biaya kirim. Terima kasih."
    ].filter(line => line !== "");

    const message = messageLines.join("\n");

    // WhatsApp click-to-chat with URL-encoded text (encodeURIComponent recommended)[web:6][web:9][web:12]
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${WHATSAPP_UMKM_NUMBER}?text=${encoded}`;

    window.location.href = waUrl;
  });
}

// Footer year
function initYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initProductCatalog();
  initCheckoutSummary();
  initCheckoutForm();
  initYear();
});

const buttons = document.querySelectorAll(".btn");

buttons.forEach(btn => {
  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translate(0,0)";
  });
});

window.addEventListener("scroll", () => {
  const scrollTop = document.documentElement.scrollTop;
  const height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;

  const scrolled = (scrollTop / height) * 100;

  document.querySelector(".scroll-bar").style.width = scrolled + "%";
});



document.querySelectorAll(".btn").forEach(button=>{
  button.addEventListener("click",function(e){

    const circle = document.createElement("span");

    const rect = this.getBoundingClientRect();

    circle.style.left = e.clientX - rect.left + "px";
    circle.style.top = e.clientY - rect.top + "px";

    circle.classList.add("ripple");

    this.appendChild(circle);

    setTimeout(()=>{
      circle.remove();
    },600);

  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {

    const targetId = this.getAttribute("href");

    if (targetId === "#") return;

    const target = document.querySelector(targetId);

    if (!target) return;

    e.preventDefault();

    window.scrollTo({
      top: target.offsetTop - 80, // offset navbar
      behavior: "smooth"
    });

  });
});