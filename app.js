import React, { useState } from "react";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const exist = cart.find((p) => p.id === product.id);
    if (exist) {
      setCart(cart.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((p) => p.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div>
      <h1>Supermarket</h1>
      <ProductList addToCart={addToCart} />
      <Cart cartItems={cart} removeFromCart={removeFromCart} />
      {cart.length > 0 && <Checkout totalAmount={totalAmount} />}
    </div>
  );
}

export default App;
