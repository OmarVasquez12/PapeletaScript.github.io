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
        // Verificar que la clave de Stripe exista
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                error: 'STRIPE_SECRET_KEY no está configurada en Vercel'
            });
        }

        const { items } = req.body;

        // Verificar carrito
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'El carrito está vacío'
            });
        }

        // Crear productos para Stripe
        const lineItems = items.map((item) => {

            const price = Number(item.price);

            // Verificar nombre
            if (!item.name) {
                throw new Error('Un producto no tiene nombre');
            }

            // Verificar precio
            if (isNaN(price) || price < 0) {
                throw new Error(
                    `Precio inválido para el producto: ${item.name}`
                );
            }

            // Información básica del producto
            const productData = {
                name: String(item.name).substring(0, 500)
            };

            /*
             * Solo enviar la imagen si:
             *
             * 1. Es una URL HTTPS
             * 2. Tiene menos de 2048 caracteres
             *
             * Si es Base64 o demasiado larga,
             * simplemente se omite.
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

                    // Stripe utiliza centavos
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

        // Devolver ID y URL de Checkout
        return res.status(200).json({
            id: session.id,
            url: session.url
        });

    } catch (error) {

        console.error(
            '❌ Error creando sesión de Stripe:',
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                'Error interno del servidor'
        });
    }
}
