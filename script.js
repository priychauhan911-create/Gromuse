// script.js - Gromuse Grocery Delivery

/* ==========================================================================
   CART STATE & CONFIGURATION
   ========================================================================== */

// Cart state: { [productId]: { id, name, price, weight, emoji, quantity } }
let cart = {};

// Order & Calculation Configuration
const FREE_DELIVERY_THRESHOLD = 25.0;
const FLAT_DELIVERY_FEE = 2.0;
const ESTIMATED_TAX_RATE = 0.05; // 5%

// Supported Promo Codes
const PROMO_CODES = {
    "GROMUSE10": { code: "GROMUSE10", type: "percent", value: 10, label: "10% off" },
    "GROMUSE20": { code: "GROMUSE20", type: "percent", value: 20, label: "20% off" },
    "FRESH20": { code: "FRESH20", type: "percent", value: 20, label: "20% off" },
    "SAVE5": { code: "SAVE5", type: "flat", value: 5.0, label: "$5.00 off" }
};

let appliedPromo = null;

// Calculate total item count across all products
function getTotalCartCount() {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
}

// Calculate raw item subtotal price
function getCartSubtotal() {
    return Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calculate comprehensive bill breakdown
function calculateBill() {
    const subtotal = getCartSubtotal();
    let discount = 0;

    if (appliedPromo && subtotal > 0) {
        if (appliedPromo.type === "percent") {
            discount = subtotal * (appliedPromo.value / 100);
        } else if (appliedPromo.type === "flat") {
            discount = Math.min(subtotal, appliedPromo.value);
        }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const deliveryFee = subtotal === 0 ? 0 : (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_DELIVERY_FEE);
    const tax = subtotal === 0 ? 0 : (discountedSubtotal * ESTIMATED_TAX_RATE);
    const grandTotal = subtotal === 0 ? 0 : (discountedSubtotal + deliveryFee + tax);

    return {
        subtotal,
        discount,
        discountedSubtotal,
        deliveryFee,
        tax,
        grandTotal
    };
}

/* ==========================================================================
   PROMO CODE HANDLERS
   ========================================================================== */

function applyPromoCode() {
    const input = document.getElementById("promo-code-input");
    const messageEl = document.getElementById("promo-message");
    if (!input || !messageEl) return;

    const rawCode = input.value.trim().toUpperCase();

    if (!rawCode) {
        showPromoMessage("Please enter a promo code.", "error");
        return;
    }

    if (getTotalCartCount() === 0) {
        showPromoMessage("Add items to your cart before applying a coupon.", "error");
        return;
    }

    if (PROMO_CODES[rawCode]) {
        appliedPromo = PROMO_CODES[rawCode];
        input.value = "";
        showPromoMessage(`🎉 Coupon ${appliedPromo.code} applied (${appliedPromo.label})!`, "success");
        updateCart();
    } else {
        showPromoMessage("Invalid code. Try GROMUSE10 for 10% off!", "error");
    }
}

function removePromoCode() {
    appliedPromo = null;
    const messageEl = document.getElementById("promo-message");
    if (messageEl) {
        messageEl.textContent = "";
        messageEl.className = "promo-message";
    }
    updateCart();
}

function showPromoMessage(msg, type) {
    const messageEl = document.getElementById("promo-message");
    if (!messageEl) return;

    messageEl.textContent = msg;
    messageEl.className = `promo-message ${type}`;

    if (type === "success") {
        setTimeout(() => {
            if (messageEl.textContent === msg) {
                messageEl.textContent = "";
                messageEl.className = "promo-message";
            }
        }, 3000);
    }
}

/* ==========================================================================
   CARD INTERACTION HANDLERS
   ========================================================================== */

function addProduct(button) {
    const card = button.closest(".product");
    if (!card) return;

    const id = card.dataset.id;
    const name = card.dataset.name || card.querySelector("h3").innerText.replace(/\n/g, " ");
    const price = parseFloat(card.dataset.price) || 10.0;
    const weight = card.dataset.weight || card.querySelector(".weight")?.innerText || "";
    const emoji = card.dataset.emoji || card.querySelector(".product-image")?.innerText?.trim() || "🛒";

    if (!cart[id]) {
        cart[id] = { id, name, price, weight, emoji, quantity: 1 };
    } else {
        cart[id].quantity++;
    }

    updateCart();
}

function handleCardAdd(id) {
    const card = document.querySelector(`.product[data-id="${id}"]`);
    if (!card) return;
    const btn = card.querySelector(".add-btn");
    if (btn) addProduct(btn);
}

function handleCardChange(id, delta) {
    changeQuantity(id, delta);
}

/* ==========================================================================
   DRAWER INTERACTION HANDLERS
   ========================================================================== */

function changeQuantity(id, delta) {
    if (!cart[id]) return;

    cart[id].quantity += delta;
    if (cart[id].quantity <= 0) {
        delete cart[id];
    }

    // Auto-remove promo code if cart becomes completely empty
    if (getTotalCartCount() === 0) {
        appliedPromo = null;
    }

    updateCart();
}

function removeProduct(id) {
    if (cart[id]) {
        delete cart[id];

        if (getTotalCartCount() === 0) {
            appliedPromo = null;
        }

        updateCart();
    }
}

/* ==========================================================================
   SYNCHRONIZATION & RENDERING
   ========================================================================== */

function updateCart() {
    updateNavbarCart();
    renderCartDrawer();
    syncProductCards();
}

// 1. Update Navbar Cart Button
function updateNavbarCart() {
    const cartBtn = document.querySelector(".cart");
    if (!cartBtn) return;

    const totalCount = getTotalCartCount();

    if (totalCount > 0) {
        cartBtn.textContent = `🛒 ${totalCount}`;
        cartBtn.style.width = "auto";
        cartBtn.style.padding = "0 11px";
        cartBtn.style.borderRadius = "20px";
        cartBtn.style.fontWeight = "700";
        cartBtn.style.fontSize = "12px";
        cartBtn.style.background = "var(--lime)";
        cartBtn.style.color = "var(--dark-green)";
    } else {
        cartBtn.textContent = "🛒";
        cartBtn.style.width = "31px";
        cartBtn.style.padding = "0";
        cartBtn.style.borderRadius = "50%";
        cartBtn.style.fontWeight = "normal";
        cartBtn.style.fontSize = "15px";
        cartBtn.style.background = "#ffffff";
        cartBtn.style.color = "inherit";
    }
}

// 2. Render Slide-over Drawer & Bill Calculations
function renderCartDrawer() {
    const itemsContainer = document.getElementById("cart-drawer-items");
    const drawerBadge = document.getElementById("cart-drawer-badge");
    const thresholdText = document.getElementById("delivery-threshold-text");
    const progressBar = document.getElementById("delivery-progress-bar");
    const checkoutBtn = document.getElementById("checkout-btn");

    // Bill summary elements
    const subtotalEl = document.getElementById("cart-subtotal");
    const discountRow = document.getElementById("cart-discount-row");
    const discountPercentTag = document.getElementById("discount-percent-tag");
    const discountValEl = document.getElementById("cart-discount-val");
    const deliveryFeeEl = document.getElementById("cart-delivery-fee");
    const deliveryNoteEl = document.getElementById("delivery-condition-note");
    const taxEl = document.getElementById("cart-tax");
    const grandTotalEl = document.getElementById("cart-total-price");

    // Promo elements
    const promoInputGroup = document.querySelector(".promo-input-group");
    const appliedBadge = document.getElementById("promo-applied-badge");
    const appliedCodeName = document.getElementById("applied-code-name");
    const appliedCodeDesc = document.getElementById("applied-code-desc");

    if (!itemsContainer) return;

    const totalCount = getTotalCartCount();
    const bill = calculateBill();

    // Update Drawer Header Count Badge
    if (drawerBadge) {
        drawerBadge.textContent = `${totalCount} item${totalCount === 1 ? "" : "s"}`;
    }

    // Update Delivery Threshold Bar ($25.00 benchmark)
    if (thresholdText && progressBar) {
        if (bill.subtotal === 0) {
            progressBar.style.width = "0%";
            thresholdText.innerHTML = "Add <strong>$25.00</strong> for <strong>FREE 15-min delivery!</strong> ⚡";
        } else if (bill.subtotal >= FREE_DELIVERY_THRESHOLD) {
            progressBar.style.width = "100%";
            thresholdText.innerHTML = "🎉 You've unlocked <strong>FREE 15-min Lightning Delivery!</strong>";
        } else {
            const needed = (FREE_DELIVERY_THRESHOLD - bill.subtotal).toFixed(2);
            const percent = Math.min(100, Math.round((bill.subtotal / FREE_DELIVERY_THRESHOLD) * 100));
            progressBar.style.width = `${percent}%`;
            thresholdText.innerHTML = `Add <strong>$${needed}</strong> more for <strong>FREE 15-min delivery!</strong> ⚡`;
        }
    }

    // Render Items or Empty State
    const items = Object.values(cart);
    if (items.length === 0) {
        itemsContainer.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon-wrap">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added any fresh groceries to your cart yet.</p>
                <button class="cart-empty-shop-btn" onclick="closeCart(); document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth' });">
                    Start Shopping
                </button>
            </div>
        `;

        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if (checkoutBtn) checkoutBtn.disabled = false;

        itemsContainer.innerHTML = items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">${item.emoji}</div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-weight">${item.weight}</span>
                    <div class="cart-item-price-unit">
                        $${item.price.toFixed(2)} × ${item.quantity} = <span class="total-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-qty">
                        <button class="cart-qty-btn dec" onclick="changeQuantity('${item.id}', -1)" aria-label="Decrease quantity">−</button>
                        <span>${item.quantity}</span>
                        <button class="cart-qty-btn inc" onclick="changeQuantity('${item.id}', 1)" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="cart-item-trash" onclick="removeProduct('${item.id}')" aria-label="Remove item" title="Remove item">🗑️</button>
                </div>
            </div>
        `).join("");
    }

    // Promo Code UI Rendering
    if (appliedPromo && totalCount > 0) {
        if (appliedBadge) appliedBadge.style.display = "flex";
        if (appliedCodeName) appliedCodeName.textContent = appliedPromo.code;
        if (appliedCodeDesc) appliedCodeDesc.textContent = appliedPromo.label;
        if (promoInputGroup) promoInputGroup.style.display = "none";
    } else {
        if (appliedBadge) appliedBadge.style.display = "none";
        if (promoInputGroup) promoInputGroup.style.display = "flex";
    }

    // Bill Summary Breakdown Rendering
    if (subtotalEl) subtotalEl.textContent = `$${bill.subtotal.toFixed(2)}`;

    // Promo Discount row
    if (discountRow) {
        if (bill.discount > 0) {
            discountRow.style.display = "flex";
            if (discountPercentTag) discountPercentTag.textContent = `(-${appliedPromo.label})`;
            if (discountValEl) discountValEl.textContent = `-$${bill.discount.toFixed(2)}`;
        } else {
            discountRow.style.display = "none";
        }
    }

    // Delivery Fee row
    if (deliveryFeeEl) {
        if (bill.subtotal === 0) {
            deliveryFeeEl.textContent = "$0.00";
            deliveryFeeEl.className = "summary-val";
            if (deliveryNoteEl) deliveryNoteEl.textContent = "Free over $25.00";
        } else if (bill.deliveryFee === 0) {
            deliveryFeeEl.textContent = "FREE";
            deliveryFeeEl.className = "summary-val free-tag";
            if (deliveryNoteEl) deliveryNoteEl.textContent = "Free unlocked! 🎉";
        } else {
            deliveryFeeEl.textContent = `$${bill.deliveryFee.toFixed(2)}`;
            deliveryFeeEl.className = "summary-val";
            if (deliveryNoteEl) deliveryNoteEl.textContent = "Free over $25.00";
        }
    }

    // Tax calculation row (5%)
    if (taxEl) taxEl.textContent = `$${bill.tax.toFixed(2)}`;

    // Grand Total (highlighted with lime green badge)
    if (grandTotalEl) grandTotalEl.textContent = `$${bill.grandTotal.toFixed(2)}`;
}

// 3. Two-Way Sync With Main Page Product Cards
function syncProductCards() {
    const productCards = document.querySelectorAll(".product");

    productCards.forEach(card => {
        const id = card.dataset.id;
        const currentItem = cart[id];
        const existingQty = card.querySelector(".quantity");
        const existingAddBtn = card.querySelector(".add-btn");

        if (currentItem && currentItem.quantity > 0) {
            if (existingQty) {
                const numSpan = existingQty.querySelector("span");
                if (numSpan) numSpan.textContent = currentItem.quantity;
            } else if (existingAddBtn) {
                const quantityBox = document.createElement("div");
                quantityBox.className = "quantity";
                quantityBox.innerHTML = `
                    <button onclick="handleCardChange('${id}', -1)">−</button>
                    <span>${currentItem.quantity}</span>
                    <button onclick="handleCardChange('${id}', 1)">+</button>
                `;
                existingAddBtn.replaceWith(quantityBox);
            }
        } else {
            if (existingQty) {
                const addBtn = document.createElement("button");
                addBtn.className = "add-btn";
                addBtn.setAttribute("onclick", "addProduct(this)");
                addBtn.innerHTML = `<span>+</span>`;
                existingQty.replaceWith(addBtn);
            }
        }
    });
}

/* ==========================================================================
   DRAWER OPEN / CLOSE CONTROLS
   ========================================================================== */

function openCart() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-drawer-overlay");

    if (drawer && overlay) {
        drawer.classList.add("active");
        overlay.classList.add("active");
        drawer.setAttribute("aria-hidden", "false");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("cart-open");
    }
}

function closeCart() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-drawer-overlay");

    if (drawer && overlay) {
        drawer.classList.remove("active");
        overlay.classList.remove("active");
        drawer.setAttribute("aria-hidden", "true");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("cart-open");
    }
}

/* ==========================================================================
   CHECKOUT FLOW
   ========================================================================== */

function handleCheckout() {
    if (getTotalCartCount() === 0) return;

    const toast = document.getElementById("checkout-toast");

    // Close drawer
    closeCart();

    // Reset Cart & Promo State
    cart = {};
    appliedPromo = null;
    updateCart();

    // Show toast
    if (toast) {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);
    }
}

/* ==========================================================================
   INITIALIZATION & EVENT LISTENERS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cart Button Click (replaces previous generic alert)
    const cartBtn = document.querySelector(".cart");
    if (cartBtn) {
        cartBtn.addEventListener("click", openCart);
    }

    // 2. Drawer Close Button & Overlay
    const closeBtn = document.getElementById("cart-drawer-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeCart);
    }

    const overlay = document.getElementById("cart-drawer-overlay");
    if (overlay) {
        overlay.addEventListener("click", closeCart);
    }

    // 3. Escape Key to close drawer
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeCart();
        }
    });

    // 4. Promo Code Buttons & Input
    const applyPromoBtn = document.getElementById("apply-promo-btn");
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener("click", applyPromoCode);
    }

    const promoInput = document.getElementById("promo-code-input");
    if (promoInput) {
        promoInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                applyPromoCode();
            }
        });
    }

    const removePromoBtn = document.getElementById("remove-promo-btn");
    if (removePromoBtn) {
        removePromoBtn.addEventListener("click", removePromoCode);
    }

    // 5. Checkout Button
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", handleCheckout);
    }

    // 6. Search Functionality
    const searchInput = document.querySelector(".search input");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = this.value.toLowerCase().trim();
            const products = document.querySelectorAll(".product");

            products.forEach(product => {
                const name = product.querySelector("h3")?.textContent.toLowerCase() || "";
                if (name.includes(query)) {
                    product.style.display = "";
                } else {
                    product.style.display = "none";
                }
            });
        });
    }

    // 7. Shop Now and See All smooth scrolling
    const shopBtn = document.querySelector(".shop-btn");
    if (shopBtn) {
        shopBtn.addEventListener("click", () => {
            document.querySelector(".products-section")?.scrollIntoView({
                behavior: "smooth"
            });
        });
    }

    const seeAllBtn = document.querySelector(".see-all");
    if (seeAllBtn) {
        seeAllBtn.addEventListener("click", () => {
            document.querySelector(".products-section")?.scrollIntoView({
                behavior: "smooth"
            });
        });
    }

    // Initial render
    updateCart();
});
