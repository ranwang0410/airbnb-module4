'use strict';
const { Booking } = require('../models');
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
    */
    await Booking.bulkCreate([
      {
        "spotId": 1,
        "userId": 1,
        "startDate": "2021-11-19",
        "endDate": "2021-11-20",
      },
      {
        "spotId": 2,
        "userId": 2,
        "startDate": "2022-1-19",
        "endDate": "2022-1-20",
      },
      {
        "spotId": 3,
        "userId": 3,
        "startDate": "2022-2-19",
        "endDate": "2022-3-20",
      },
    ],{ validate: true })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      startDate: { [Op.in]: ['2021-11-19', '2022-1-19', '2022-2-19'] }
    }, {});

  }
};
