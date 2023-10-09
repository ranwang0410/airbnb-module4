'use strict';
const { Review } = require('../models');
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
   await Review.bulkCreate([
    {
      "userId": 1,
      "spotId": 1,
      "review": "This is first review!",
      "stars": 5,
    },
    {
      "userId": 2,
      "spotId": 2,
      "review": "This is second review!",
      "stars": 2,
    },
    {
      "userId": 3,
      "spotId": 3,
      "review": "This is third review!",
      "stars": 3,
    }
   ],{ validate: true })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Reviews';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      review: { [Op.in]: ['This is first review!', 'This is second review!', 'This is third review!'] }
    }, {});
  }
};
