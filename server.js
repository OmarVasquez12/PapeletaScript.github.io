// /api/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51TvO8eJ1XuVrDlLNVF9SdqO85YzMUbP1HOjgI2YftInIHa7WlXOzqwcQYcXkYdAdGwViqkORxCPyhTNetnfSq8sg001gitMbzV'); 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items, total, discount } = req.body;

    // Convertir productos a formato Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.image], // Asegúrate que sea URL absoluta (https://...)
          metadata: { id: item.id }
        },
        unit_amount: Math.round(item.price * 100), // Stripe usa centavos
      },
      quantity: 1,
    }));

    // Crear sesión
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/carrito.html`,
      metadata: {
        discount: discount || 'none'
      },
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message });
  }
}
