'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create global_config table for system-wide settings
    await queryInterface.createTable('global_config', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Configuration key (e.g., CURRENT_CSR_PRICE)',
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Configuration value (stored as string, parse as needed)',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of what this config controls',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('global_config');
  },
};
