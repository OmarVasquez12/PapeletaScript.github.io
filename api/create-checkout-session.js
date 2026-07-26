import Stripe from 'stripe';

export default async function handler(req, res) {
    try {
        console.log('ENV STRIPE:', process.env.STRIPE_SECRET_KEY ? 'EXISTE' : 'NO EXISTE');

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                error: 'STRIPE_SECRET_KEY no está disponible en Vercel'
            });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        return res.status(200).json({
            success: true,
            message: 'Stripe está configurado correctamente'
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: error.message
        });
    }
}
