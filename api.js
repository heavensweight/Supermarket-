const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

export const fetchProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
};

export const createPaymentIntent = async (amount) => {
  const res = await fetch(`${API_URL}/payments/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return res.json();
};
