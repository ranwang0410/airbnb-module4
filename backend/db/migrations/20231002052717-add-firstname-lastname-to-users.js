'use strict';


/** @type {import('sequelize-cli').Migration} */
let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    options.tableName = "Users";
    await queryInterface.addColumn(options, 'firstName', {
      type: Sequelize.STRING(30),
      allowNull:false
    });
    // await queryInterface.addColumn('Users','firstName',{
    //   type:Sequelize.STRING(30),
    // });
    // await queryInterface.addColumn('Users','lastName',{
    //   type:Sequelize.STRING,
    //   allowNull:true,
    // })
    await queryInterface.addColumn(options, 'lastName', {
      type: Sequelize.STRING(30),
      allowNull:false
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Users','firstName');
    await queryInterface.removeColumn('Users','lastName');
  },
};
