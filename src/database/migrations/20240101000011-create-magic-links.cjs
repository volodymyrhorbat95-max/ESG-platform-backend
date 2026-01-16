'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('magic_links', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      token: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Add index on token for fast lookup
    await queryInterface.addIndex('magic_links', ['token'], {
      name: 'idx_magic_links_token',
    });

    // Add index on expires_at for cleanup queries
    await queryInterface.addIndex('magic_links', ['expires_at'], {
      name: 'idx_magic_links_expires_at',
    });

    // Add index on user_id
    await queryInterface.addIndex('magic_links', ['user_id'], {
      name: 'idx_magic_links_user_id',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('magic_links');
  }
};
