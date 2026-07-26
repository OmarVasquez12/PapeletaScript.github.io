import Stripe from 'stripe';

// Usa la variable de entorno de Vercel o una clave por defecto para pruebas locales
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51TvO8eJ1XuVrDlLNVF9SdqO85YzMUbP1HOjgI2YftInIHa7WlXOzqwcQYcXkYdAdGwViqkORxCPyhTNetnfSq8sg001gitMbzV');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Convertir productos a formato Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100), // Stripe usa centavos
      },
      quantity: 1,
    }));

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/Carrito.html`,
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Error en API:', err);
    res.status(500).json({ error: err.message });
  }
}
