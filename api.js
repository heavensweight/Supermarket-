const API_URL = "https://YOUR_BACKEND_URL_HERE/api"; // Render backend URL placeholder

export const fetchProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

export const createPaymentIntent = async (amount) => {
  const res = await fetch(`${API_URL}/payments/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount })
  });
  return res.json();
};

// Add more APIs: signup, orders, update inventory, etc.

