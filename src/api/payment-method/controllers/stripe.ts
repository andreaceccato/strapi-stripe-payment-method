/**
 * payment-method controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::payment-method.payment-method', ({ strapi }) =>  ({

    async config(ctx) {
        let config = await strapi.service('api::payment-method.stripe').config();
        // Rimuovo secret_key
        delete config.secret_key
        ctx.body = config
    },

    async webHook(ctx) {
        let webHook = await strapi.service('api::payment-method.stripe').webHook(ctx.request.body);
        ctx.body = webHook
    },

    async testing(ctx) {
        let session = await strapi.service('api::payment-method.stripe').createSession(ctx.request.body);
        ctx.body = session
    }

 })
);