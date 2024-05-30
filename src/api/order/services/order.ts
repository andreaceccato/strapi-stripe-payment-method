/**
 * order service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::order.order', ({strapi}) => ({

    async findOne(entityId, params = {}) {
        return strapi.db.query('api::order.order').findOne({where: {uuid: entityId}});
    }
    
}));
