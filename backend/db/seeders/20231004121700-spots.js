'use strict';
const { Spot } = require('../models');
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     *
    */
   await Spot.bulkCreate([
    {
      "ownerId": 1,
      "address": "123 Disney Lane",
      "city": "San Francisco",
      "state": "California",
      "country": "United States of America",
      "lat": 37.7645358,
      "lng": -122.4730327,
      "name": "App Academy",
      "description": "Place where web developers are created",
      "price": 123
    },
    {
      "ownerId": 2,
      "address": "11111",
      "city": "LA",
      "state": "California",
      "country": "United States of America",
      "lat": 20,
      "lng": -122,
      "name": "App Academy",
      "description": "Place where web developers are LOCATED",
      "price": 100
    },
    {
      "ownerId": 3,
      "address": "3333",
      "city": "LA",
      "state": "California",
      "country": "United States of America",
      "lat": 30,
      "lng": -133,
      "name": "App Academy",
      "description": "Place where web developers are LOCATED",
      "price": 99
    }
   ],{validate:true})
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      address: { [Op.in]: ['123 Disney Lane', '11111','3333'] }
    }, {});
  }
};
