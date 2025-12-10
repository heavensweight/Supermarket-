document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('/api/products');
  const products = await response.json();

  const productContainer = document.querySelector('#products');

  products.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');
    productDiv.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>Price: $${product.price}</p>
      <button>Add to Cart</button>
    `;
    productContainer.appendChild(productDiv);
  });
});
