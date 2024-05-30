/**
 * stripe router
 */
export default {
    routes: [
      { 
        method: 'GET',
        path: '/payment-method/stripe',
        handler: 'stripe.config',
        config: {
          auth: false,
          policies: [],
          middlewares: ['global::recaptcha'],
        },
      },
      { 
        method: 'POST',
        path: '/payment-method/stripe/webhook',
        handler: 'stripe.webHook',
        config: {
            auth: false,
            policies: [],
            middlewares: ['api::payment-method.webhook-stripe'],
        },
      },
      { 
        method: 'POST',
        path: '/payment-method/stripe/testing-checkout-session',
        handler: 'stripe.testing',
        config: {
            auth: false,
            policies: [],
            middlewares: ['global::recaptcha', 'api::order.checkout-order'],
        },
      },
    ]
}