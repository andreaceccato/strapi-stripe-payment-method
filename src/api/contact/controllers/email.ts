/**
 * payment-method controller
 */

import { factories } from '@strapi/strapi'
const Handlebars = require('handlebars')

export default factories.createCoreController('api::contact.contact', ({ strapi }) =>  ({

    async testing(ctx) {
        const config = await strapi.service('api::contact.email').config();

        let order = await strapi.db.query('api::order.order').findOne({
            where: {
                $or: [
                    {id:  ctx.request.body.order}, 
                    {uuid: ctx.request.body.order},
                    {code: ctx.request.body.order},
                ]},
        });

        if (!order) {
            return {message: 'Ordine non trovato'}
        }

        let html = Handlebars.compile(await strapi.service('api::contact.template').order())
        html = html(order)


        const send = await strapi.service('api::contact.email').order(order);

        ctx.body = {
            config: config,
            send: send,
            order: order,
        }
    }

 })
);