/**
 * order controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController('api::order.order', ({ strapi }) =>  ({

    async sendRequest(ctx) {
        ctx.body = await strapi.service('api::order.checkout').sendRequest(ctx.request.body.order)
    }

 })
);