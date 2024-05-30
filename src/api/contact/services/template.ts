/**
 * contact service
 */

import { factories } from '@strapi/strapi';
const fs = require("fs");
const Handlebars = require('handlebars');

export default factories.createCoreService('api::contact.contact', ({ strapi }) => ({

  getTemplateFileString(templateFilename) {
    const path = require('path');

    // Ottieni il percorso del progetto
    const projectPath = process.cwd();

    const fileName = projectPath + '/templates/' + templateFilename;
    // using the readFileSync() function
    // and passing the path to the file
    const buffer = fs.readFileSync(fileName, 'utf8'); //  {encoding:'utf8', flag:'r'}

    return buffer.toString();

  },

  /** 
   * Inizializzaione dei componenti in comunte
   * @param template Template della mail
   */
  setup(template) {
    let initYearProject = 2024
    let currentYear = (new Date()).getFullYear()
    let copyrightNumber = currentYear > initYearProject ? `${initYearProject} - ${currentYear}` : String(currentYear);

    return template.replace(/{{ header }}/g, this.getTemplateFileString('header.html'))
                   .replace(/{{ footer }}/g, this.getTemplateFileString('footer.html'))
                   .replace(/{{ footer-info }}/g, this.getTemplateFileString('footer-info.html'))
                   .replace(/{{ copyright-number }}/g, copyrightNumber)
                   .replace(/{{ piva }}/g,'04860830266')
  },

  order() {
    // return this.getTemplateFileString('order.html')
    let template = this.getTemplateFileString('order.html')
    template = this.setup(template);
    return template;
  },

  orderAdmin() {
    // return this.getTemplateFileString('order.html')
    let template = this.getTemplateFileString('order-to-admin.html')
    template = this.setup(template);
    return template;
  },

  contactForm() {
    let template = this.getTemplateFileString('contact.html')
    template = this.setup(template);
    return template;
  },

  logo() {
    return this.getTemplateFileString('logo-large.html');
  },

  header() {
    // return this.getTemplateFileString('header.html');
  },

  footer() {
    // return this.getTemplateFileString('footer.html');
  },


})
);