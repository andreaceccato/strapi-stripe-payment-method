/**
 * contact service
 */

import { factories } from '@strapi/strapi';

const Handlebars = require('handlebars');
const Logger = require('@ululab/logger-js');

export default factories.createCoreService('api::contact.contact', ({ strapi }) => ({

    /**
     * Recupero dati di configurazione delle email-contatti dal database
     * 
     * @returns {object}
     */
    async config() {
        const config = await strapi.query('api::info.info').findOne();
        // Controllo se non siamo in produzione
        if (['prod', 'production'].indexOf(process.env.NODE_ENV) < 0) {
            for (const key in config) {
                if (key.startsWith('email_')) {
                    config[key] = process.env.EMAIL_TESTING;
                }
            }
        }
        return config
    },

    emailTo(email) {
        return ['prod', 'production'].indexOf(process.env.NODE_ENV) ?
                email.trim() :
                process.env.EMAIL_TESTING;
    },

    /**
     * Invio mail
     * 
     * @param {object} data Dati impostazioni di invio mail
     * @returns {object}
     */
    async send(data) {

        let result = {
            sent: false,
            smtp: null,
            emailSettings: data,
            error: null
        }

        try {
            result.smtp = await strapi.plugins['email'].services.email.send(data);
            result.sent = true
        } catch (error) {
            console.log(error)
            Logger.channel('email').info({error: error.toString()})
            result.error = error.toString()
        }

        return result
    },

    /**
     * Invio mail per ordine
     * @param {object} data Oggetto ordine
     * @returns {object}
     */
    async order(data) {
        const config = await this.config()

        const configStripe = await strapi.service('api::payment-method.stripe').config()

        // Url per la pagina post-checkout
        let searchParamsEmail = new URLSearchParams({
            uuid: data.uuid,
            code: data.code,
            token: data.token,
        });

        let checkout_completed_url = `${configStripe.success_url}?${searchParamsEmail.toString()}`
      
        data.strings = {
            id: String(data.id).padStart(8, '0'),
            amount_total: (data.metadata.session.amount_total/100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            address_complete: [
                data.metadata.shipping.address.line1, 
                data.metadata.shipping.address.city, 
                data.metadata.shipping.address.postal_code,
                data.metadata.shipping.address.state,
                data.metadata.shipping.address.country
            ].join(', '),
            checkout_completed_url: checkout_completed_url
        }

        let htmlA = Handlebars.compile(await strapi.service('api::contact.template').orderAdmin())
        htmlA = htmlA(data)

        let htmlC = Handlebars.compile(await strapi.service('api::contact.template').order())
        htmlC = htmlC(data)

        
        let dataEmail = [
            {
                to: config.email_orders,
                subject: `Ordine nubensa.it #${data.code}`,
                html: htmlA
            },
            {
                to: data.metadata.customer_details.email,
                subject: `Ordine nubensa.it #${data.code}`,
                html: htmlC
            } 
        ]

        let report = []

        for (const confEmail of dataEmail) {
            report.push( await this.send(confEmail) )
        }

        return report
    },

    /**
     * Invio mail da form di contatto
     * @param data 
     * @returns 
     */
    async contactForm(data) {
        const config = await this.config()

        let htmlA = Handlebars.compile(await strapi.service('api::contact.template').contactForm())
        htmlA = htmlA(data)

        let dataEmail = [
            {
                to: config.email_admin,
                subject: `Nuovo Contatto nubensa.it #${data.id} - ${data.data.type_contact_form.label}`,
                html: htmlA
            }
        ]

        let report = []

        for (const confEmail of dataEmail) {
            report.push( await this.send(confEmail) )
        }

        return report
    },

}));