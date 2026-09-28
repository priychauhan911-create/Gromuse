// script.js

let cartCount = 0;


/* ADD PRODUCT */

function addProduct(button) {
    cartCount++;

    const quantityBox = document.createElement("div");
    quantityBox.className = "quantity";
    quantityBox.innerHTML = `
    <button onclick="decrease(this)">−</button>
    <span>1</span>
    <button onclick="increase(this)">+</button>
  `;

    button.replaceWith(quantityBox);
    updateCart();
}


/* INCREASE */

function increase(button) {
    const quantityBox = button.parentElement;
    const number = quantityBox.querySelector("span");

    let value = parseInt(number.textContent, 10);
    value++;
    number.textContent = value;

    cartCount++;
    updateCart();
}


/* DECREASE */

function decrease(button) {
    const quantityBox = button.parentElement;
    const number = quantityBox.querySelector("span");

    let value = parseInt(number.textContent, 10);

    if (value > 1) {
        value--;
        number.textContent = value;
        cartCount--;
    } else {
        cartCount--;

        const addBtn = document.createElement("button");
        addBtn.className = "add-btn";
        addBtn.setAttribute("onclick", "addProduct(this)");
        addBtn.innerHTML = `<span>+</span>`;

        quantityBox.replaceWith(addBtn);
    }

    cartCount = Math.max(0, cartCount);
    updateCart();
}


/* CART */

function updateCart() {

    const cart = document.querySelector(".cart");

    if (cartCount > 0) {

        cart.textContent = `🛒 ${cartCount}`;

        cart.style.width = "auto";
        cart.style.padding = "0 9px";
        cart.style.borderRadius = "20px";
        cart.style.fontWeight = "600";

    } else {

        cart.textContent = "🛒";

    }
}


/* SEARCH */

const searchInput = document.querySelector(".search input");

searchInput.addEventListener("input", function () {

    const query = this.value.toLowerCase().trim();

    const products = document.querySelectorAll(".product");

    products.forEach(product => {

        const name = product.querySelector("h3").textContent.toLowerCase();

        if (name.includes(query)) {
            product.style.display = "";
        } else {
            product.style.display = "none";
        }

    });

});


/* SHOP NOW */

document.querySelector(".shop-btn").addEventListener("click", () => {

    document.querySelector(".products-section").scrollIntoView({
        behavior: "smooth"
    });

});


/* SEE ALL */

document.querySelector(".see-all").addEventListener("click", () => {

    document.querySelector(".products-section").scrollIntoView({
        behavior: "smooth"
    });

});


/* CART CLICK */

document.querySelector(".cart").addEventListener("click", () => {

    if (cartCount === 0) {
        alert("Your cart is empty.");
    } else {
        alert(`You have ${cartCount} item(s) in your cart.`);
    }

});