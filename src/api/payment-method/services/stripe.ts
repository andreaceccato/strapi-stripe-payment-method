/**
 * order service
 * 
 * @link: https://docs.stripe.com/api/checkout/sessions/create?lang=node
 */

import { factories } from "@strapi/strapi";
import stripe from "../routes/stripe";

// import Stripe from "stripe";
const Stripe = require('stripe');
const uuid = require('uuid');

export default factories.createCoreService('api::payment-method.payment-method', ({ strapi }) =>  ({

    /**
     * Recupero dei dati di configurazione dal database
     * 
     * @returns {object}
     */
    async config() {
        try {
            const config = await strapi.query('api::payment-method.payment-method').findOne({
                where: { code: 'stripe' },
            });
            let mode = config.data.mode
            return config.data[mode]
        } catch (error) {
            return {
                message: "Payment method is not config", 
                error: error.toString()
            }
        }

    },
    
    /**
     * Inizializzazione oggetto Stripe
     * 
     * @returns {object<Stripe>}
     */
    async init() {
        const config = await this.config()
        return Stripe(config.secret_key);
    },


    async sendRequest(data: Object) {
        return {
            uuid: uuid.v4(),
            data: data};
    },

    /**
     * Preparazione dela singola riga oggetto
     * @param data 
     * @returns {array}
     */
    prepareSingleLineItem(data) {
        let images = data.image?.url ? [data.image?.url] : []
        let unit_amount_decimal = (Number(data.price) * 100).toFixed(0)
        return {
            quantity: data.quantity,
            price_data: {
                currency: 'eur',
                unit_amount_decimal: unit_amount_decimal, // #dinamic
                tax_behavior: 'inclusive',
                product_data: { // #dinamic
                    name: data.name,
                    description: data.description ? data.description : data.name,
                    images: images
                }
            }
        }
    },

    /**
     * Preparazione delle righe "Line Items" per il pagamento stripe
     * @param data 
     * @returns {array}
     */
    prepareLineItems(data) {
        return data.map(e => this.prepareSingleLineItem(e))
    },

    /**
     * Creazione sessione stripe
     * 
     * @returns {object<Stripe>}
     */
    async createSession(order) {
        const config = await this.config()

        const stripe = Stripe(config.secret_key);
        
        // righe ordine: articoli + costi/sconti
        let line_items = order.data.line_items.concat(order.data.line_extra);

        console.log(this.prepareLineItems(line_items));

        // Url per la pagina post-checkout
        let searchParams = new URLSearchParams({
            uuid: order.uuid,
            code: order.code,
            token: order.token,
            // session_id: '{CHECKOUT_SESSION_ID}',
            thank_you_page:  '1'
        });

        let success_url = `${config.success_url}?${searchParams.toString()}`

        // Metadata id + uuid dell'ordine
        let metadata = {
            id: order.id,
            uuid: order.uuid,
            code: order.code
        }

        const session = stripe.checkout.sessions.create({
            success_url: success_url,
            line_items: this.prepareLineItems(line_items),
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['IT']
            },
            payment_method_types: ['card', 'paypal'],
            locale: 'it',
            allow_promotion_codes: true,
            metadata: metadata
        });

        return session
    },

    /**
     * Weebhook stripe
     * 
     * @returns {object<Stripe>}
     */
    async webHook(data) {
        const config = await this.config()
        // data.object.customer_details
        // data.metadata

        // modifica ordine

        // modifico l'ordine con i dati dell'oggetto event di stripe
        if (data.type == 'checkout.session.completed') {
            let order = await strapi.db.query('api::order.order').findOne({
                            where: {id:  data.data.object.metadata.id},
                        });
            console.log('Before-order.metadata: ', order.metadata)
            order.metadata = Object.assign(order.metadata, {
                payment: {
                    id: data.data.object.payment_intent,
                    status: data.data.object.payment_status,  
                },
                shipping: data.data.object.shipping,
                customer_details: data.data.object.customer_details
            });

            /**
             * Aggiorno l'importo finale pagato:
             * puó variare in caso di codici promozionali applicati nel checkout di stripe
             * - Il "subtotale" dovrebbe essere inalterato (per sicurezza lo inserimao in modifica)
             * - Il "totale" viene variato in caso di sconto
             */
            order.metadata.session.amount_subtotal = data.data.object.amount_subtotal 
            order.metadata.session.amount_total = data.data.object.amount_total

            console.log('After-order.metadata: ', order.metadata)            
            await strapi.db.query('api::order.order').update({
                where: {id:  data.data.object.metadata.id},
                data: {
                    metadata: order.metadata,
                    status: 'paid'
                },
            });

            const send = await strapi.service('api::contact.email').order(order);

            return {message: 'Webhook Iniziato con successo!', config: config, email: send}
        } else if (data.type == 'checkout.session.expired') {
            // Modificare lo stato ??
            // É giá in 'unpaid'
            // let order = await strapi.db.query('api::order.order').findOne({
            //     where: {id:  data.data.object.metadata.id},
            // });
            // await strapi.db.query('api::order.order').update({
            //     where: {id:  data.data.object.metadata.id},
            //     data: {
            //         metadata: order.metadata,
            //         status: 'paid'
            //     },
            // });
        }

        return {message: 'Webhook Iniziato con successo!', config: config}
    },

 })
);