/**
 * `webhook` middleware
 * 
 * @link Doc Stripe https://docs.stripe.com/identity/handle-verification-outcomes?lang=node
 * @link GitHub Docs WebHook https://github.com/stripe/stripe-node?tab=readme-ov-file#webhook-signing
 * @link Forum Strapi https://forum.strapi.io/t/get-raw-request-body-in-custom-controller/14560
 */

import { Strapi } from '@strapi/strapi';
const axios = require('axios');
const Logger = require('@ululab/logger-js');

export default (config, { strapi }: { strapi: Strapi }) => {

  return async (ctx, next) => {
    strapi.log.info('In webhook-stripe middleware.');

    // Recupero la configurazione stripe
    let stripe_config = await strapi.service('api::payment-method.stripe').config();

    const stripe = require('stripe')(stripe_config.secret_key)

    // Signature in headers
    const sig = ctx.request.headers['stripe-signature'];

    // Request Body - rawBody/corpoGrezzo originale koa
    const webhookRawBody = ctx.request.body[Symbol.for('unparsedBody')]; 

    try {
        
       stripe.webhooks.constructEvent(webhookRawBody, sig, stripe_config.whsec); 

    } catch (error) {
        console.log(error)
        // Salviamo il log
        Logger.channel('webhook-stripe').error({error: error.toString(), webhookRawBody: webhookRawBody})
        // Blocchiamo l'accesso
        ctx.throw(403, 'Access denied', { details: {
          // message:  error.toString()
        } });
    }
    
    await next();
  };
};


