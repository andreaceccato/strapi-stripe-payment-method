/**
 * `checkout-order` middleware
 * 
 * Questo middleware deve controllare se l'oggetto "Richesta Ordine Checkout" ricevuto via api é valido
 */

const Logger = require('@ululab/logger-js');
const _ = require('lodash');

import { Strapi } from '@strapi/strapi';

export default (config, { strapi }: { strapi: Strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    strapi.log.info('In checkout-order middleware.');

    if (!ctx.request.body?.data?.line_items) {
      ctx.throw(403, 'Invalid order checkout', { details: {
        data: {}
      } });
    }

    var invalid_items = [];
    var line_items = [];

    let line_items_id = ctx.request.body.data.line_items.map(e => e.id)

    // Utilizzo di una query unica al db per otimizzazione
    // Cerchiamo gli articoli sia per id (integer) o code (string)
    const line_items_db = await strapi.db.query('api::package.package').findMany({
      // where: { id: line_items_id }
      where: { $or: [ {id: line_items_id}, {code: line_items_id} ] },
      populate: ['image_portrait', 'products.size', 'products.product.flavor', 'products.product.image']
    });

    // recupero scatola default
    const container = await strapi.db.query('api::container.container').findOne({
      where: { default: true }
    });
    
    // Cilco delle righe oridine
    ctx.request.body.data.line_items.forEach(async (element) => {

      const item = line_items_db.find(e => [e.id, e.code].indexOf(element.id) > -1)

      // Caso in cui l'oggetto non venga trovato nel db 
      if(!item) {
        invalid_items.push({message: 'Not found', item: element});
      } 
      // Caso in cui l'oggetto non ha una qta valida
      else if (!(Number.isInteger(element.quantity) && element.quantity >= 1)) {
        invalid_items.push({message: 'Invalid quantity', item: element});
      } else {
        item.quantity = element.quantity
        item.amount = item.quantity * item.price
        line_items.push(item);
      }
      
    });
    
    // Gestione delle righe d'ordine non valide
    if(invalid_items.length > 0) 
    {
      Logger.channel('order').error({
        point: 'middleware',
        message: 'Invalid items', 
        details:  {
          invalid_items: invalid_items,
        }
      });

      ctx.throw(400, 'Alcuni prodotti al carrello non validi', { details: {
          invalid_items: invalid_items,
      }});
    }

    // Qty totale articoli ordine
    const order_quantity = line_items.reduce((qty, e) => qty + e.quantity, 0);

    console.log(order_quantity)

    // Costo totale conteiner/scatole
    const total_cost_container = Number((container.cost * order_quantity).toFixed(2));

    // Array costi fissi extra
    const line_extra = [
      {
        id: container.id,
        type: 'container',
        code: container.code,
        name: container.name,
        description: container.description,
        price: container.cost,
        amount: total_cost_container,
        quantity: order_quantity,
        metadata: {
          formula: `${order_quantity}pz * ${container.cost}€ = ${total_cost_container}€`
        },
      }
    ];

    /**
     * funzione per l'oggetto immagine
     * @param e 
     * @returns 
     */
    function imageObejct(e) {
      return e ? _.assign(
        {type: 'media'},
        _.pick(e, ['id', 'name', 'hash', 'alternativeText', 'caption', 'mime', 'ext','url'])
        ) : null
    }

    // Totale articoli
    const total_amount_line_items = line_items.reduce((tot, e) => tot + e.price * e.quantity, 0)

    line_items = line_items.map(e => {
      return {
        id: e.id,
        type: 'package',
        code: e.code,
        name: e.name,
        price: Number(e.price).toFixed(2),
        amount: e.amount,
        quantity: e.quantity,
        image: imageObejct(e.image_portrait),
        details: {
          products: e.products.map(e => {
            return {
              type: 'product',
              id: e.product.id,
              code: e.product.code,
              name1: e.product.name,
              name2: e.product.name_general,
              quantity: e.quantity,
              image: imageObejct(e.product.image),
              details: {
                size: {
                  id: e.size.id,
                  weight: e.size.weight,
                  name1: e.size.name,
                },
                flavor: {
                  id: e.product.flavor.id,
                  code: e.product.flavor.code,
                  name1: e.product.flavor.name,
                }
              }
            }
          })
        }
      }
    })

    // Totale costi/sconti extra
    const total_amount_line_extra = line_extra.reduce((tot, e) => tot + e.price * e.quantity, 0)

    // Popolo la richiesta con il "prepare object" order
    ctx.request.body.order = {
      total_quantity: order_quantity,
      total_amount: total_amount_line_items + total_amount_line_extra,  
      total_amount_line_items: total_amount_line_items,
      total_amount_line_extra: total_amount_line_extra,
      line_items: line_items,
      line_extra: line_extra,
      metadata: {}
    }

    await next();
  };
};
