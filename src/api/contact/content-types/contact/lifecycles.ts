'use strict';

export default {

  afterCreate: async (event) => {

    console.log(event.result);

    const send = await strapi.service('api::contact.email').contactForm(event.result);

  },

  afterUpdate: async (event) => {

    console.log(event.result);

    // const send = await strapi.service('api::contact.email').form(event);

  },

}
