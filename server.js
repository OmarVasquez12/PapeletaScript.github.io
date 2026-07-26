// server.js
const express = require('express');
const stripe = require('stripe')(sk_test_51TvO8eJ1XuVrDlLNVF9SdqO85YzMUbP1HOjgI2YftInIHa7WlXOzqwcQYcXkYdAdGwViqkORxCPyhTNetnfSq8sg001gitMbzV'); // ⚠️ Usa tu sk_test_ real
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items, total, orderId } = req.body;

    // Convertir productos del carrito a formato Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.image], // Asegúrate que item.image sea una URL válida
          metadata: {
            product_id: item.id
          }
        },
        unit_amount: Math.round(item.price * 100), // Stripe usa centavos
      },
      quantity: 1,
    }));

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `https://tusitio.com/success.html?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: 'https://tusitio.com/carrito.html?cancelled=true',
      metadata: {
        order_id: orderId,
        discount: req.body.discount || 'none'
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
