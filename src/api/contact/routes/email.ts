/**
 * stripe router
 */
export default {
    routes: [
      { 
        method: 'POST',
        path: '/email/testing',
        handler: 'email.testing',
        config: {
          auth: false,
          policies: [],
          middlewares: ["global::recaptcha"],
        },
      },
    ]
}