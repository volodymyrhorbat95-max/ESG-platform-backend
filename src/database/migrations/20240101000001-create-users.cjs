'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Email is the only required field (for CLAIM type minimal registration)',
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Required for standard/full registration',
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Required for standard/full registration',
      },
      date_of_birth: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Required for full registration (10+ euro)',
      },
      street: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Required for full registration (10+ euro)',
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Required for full registration (10+ euro)',
      },
      postal_code: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Required for full registration (10+ euro)',
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Required for full registration (10+ euro)',
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      registration_level: {
        type: Sequelize.ENUM('minimal', 'standard', 'full'),
        allowNull: false,
        defaultValue: 'minimal',
        comment: 'minimal=email only (CLAIM), standard=email+name, full=all fields (10+ euro)',
      },
      corsair_connect_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'True when user crosses 10 euro threshold - triggers Corsair Connect account',
      },
      terms_accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Required for full registration',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['registration_level']);
    await queryInterface.addIndex('users', ['corsair_connect_flag']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
