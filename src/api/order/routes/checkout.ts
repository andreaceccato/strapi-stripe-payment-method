/**
 * order router
 */
export default {
    routes: [
      { 
        method: 'POST',
        path: '/checkout/send-request',
        handler: 'checkout.sendRequest',
        config: {
          auth: false,
          policies: [],
          middlewares: ['global::recaptcha', 'api::order.checkout-order'],
      },
      },
    ]
}