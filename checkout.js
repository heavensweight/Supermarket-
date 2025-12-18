import React, { useState } from "react";
import { createPaymentIntent } from "../services/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ totalAmount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { clientSecret } = await createPaymentIntent(totalAmount);

    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (error) setMessage(error.message);
    else setMessage("Payment Successful!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">Pay ${(totalAmount / 100).toFixed(2)}</button>
      <p>{message}</p>
    </form>
  );
}

export default function Checkout({ totalAmount }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm totalAmount={totalAmount} />
    </Elements>
  );
}
