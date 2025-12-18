import React, { useEffect, useState } from "react";
import { fetchProducts } from "../services/api";

export default function ProductList({ addToCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  return (
    <div>
      <h2>Products</h2>
      {products.map((p) => (
        <div key={p.id} className="product">
          <h3>{p.name}</h3>
          <p>${(p.price / 100).toFixed(2)}</p>
          <button onClick={() => addToCart(p)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}
