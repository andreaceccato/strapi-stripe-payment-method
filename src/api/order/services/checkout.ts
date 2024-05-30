/**
 * order service
 */

import { factories } from "@strapi/strapi";

const Stripe = require('stripe');
const uuid = require('uuid');
import { nanoid } from 'nanoid'
import cryptoRandomString from 'crypto-random-string';


export default factories.createCoreService('api::order.order', ({ strapi }) =>  ({

    async sendRequest(data) {
        
        // Creazione ordine in database
        const order_uuid = uuid.v4()
        const code = cryptoRandomString({length: 8, type: 'numeric'})
        const token = nanoid(101)

        const order = await strapi.entityService.create('api::order.order', {
            data: {
                uuid: order_uuid,
                code: code,
                token: token,
                data: data,
                status: 'in-pending'
            },
        });

        const session = await strapi.service('api::payment-method.stripe').createSession(order)

        // modifico l'ordine con i dati dell'oggetto sessione di stripe
        await strapi.db.query('api::order.order').update({
            where: {id:  order.id},
            data: {
                metadata: {
                    type: 'stripe',
                    livemode: session.livemode,
                    session: {
                        id: session.id,
                        url: session.url,
                        success_url: session.success_url,
                        cancel_url: session.cancel_url,
                        amount_subtotal: session.amount_subtotal,
                        amount_total: session.amount_total,
                    },
                    payment: {
                        id: 0,
                        status: session.payment_status, 
                    },
                },
                status: 'unpaid'
            },
        });

        // Ritorno oggetto: ordine + sessione
        return {
            order: order,
            session: session
        };
    },

 })
);