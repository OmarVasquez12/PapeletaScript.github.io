import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Método no permitido'
        });
    }

    try {
        const { items } = req.body;

        // Validar carrito
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'El carrito está vacío'
            });
        }

        // Crear productos para Stripe
        const lineItems = items.map((item) => {

            const price = Number(item.price);

            if (!item.name) {
                throw new Error('Un producto no tiene nombre');
            }

            if (isNaN(price) || price < 0) {
                throw new Error(`Precio inválido para: ${item.name}`);
            }

            // Datos básicos del producto
            const productData = {
                name: String(item.name).substring(0, 500)
            };

            /*
             * Solo enviar la imagen a Stripe si:
             * 1. Es una URL HTTPS
             * 2. Tiene menos de 2048 caracteres
             *
             * Esto evita el error:
             * "Invalid URL: URL must be 2048 characters or less."
             */
            if (
                typeof item.image === 'string' &&
                item.image.startsWith('https://') &&
                item.image.length <= 2048
            ) {
                productData.images = [item.image];
            }

            return {
                price_data: {
                    currency: 'usd',

                    product_data: productData,

                    // Stripe trabaja en centavos
                    unit_amount: Math.round(price * 100)
                },

                quantity: 1
            };
        });

        // Obtener dominio actual
        const origin =
            req.headers.origin ||
            `https://${req.headers.host}`;

        // Crear sesión de Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],

            line_items: lineItems,

            mode: 'payment',

            success_url:
                `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
                `${origin}/Carrito.html`
        });

        // Devolver ID de sesión
        return res.status(200).json({
            id: session.id
        });

    } catch (err) {

        console.error('❌ Error creando Checkout Session:', err);

        return res.status(500).json({
            error: err.message || 'Error interno del servidor'
        });
    }
}
