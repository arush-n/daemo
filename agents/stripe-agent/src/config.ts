import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing in .env');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Relying on default or latest API version
    timeout: 120000,
    maxNetworkRetries: 3,
});
