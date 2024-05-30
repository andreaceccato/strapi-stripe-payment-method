/**
 * contact router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::contact.contact', {
    config: {
      
      create: {
        middlewares: ["global::recaptcha"],
      },

    //   update: {
    //     middlewares: ["global::recaptcha"],
    //   }
    },
});
