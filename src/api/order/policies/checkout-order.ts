/**
 * checkout-order policy
 */

export default (policyContext, config, { strapi }) => {
    // Add your own logic here.
    strapi.log.info('In checkout-order policy.');

    const canDoSomething = true;

    if (canDoSomething) {
      return true;
    }

    return false;
};
