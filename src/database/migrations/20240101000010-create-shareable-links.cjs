'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shareable_links', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
        comment: 'The user whose dashboard this link shares',
      },
      token: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'Secure random token for URL (e.g., /share/abc123...)',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional expiration date (null = never expires)',
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'If false, link requires authentication',
      },
      view_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of times this link has been viewed',
      },
      last_viewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last view',
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

    // Unique index on token for fast lookups
    await queryInterface.addIndex('shareable_links', ['token'], {
      unique: true,
      name: 'shareable_link_token_unique',
    });

    // Index for lookups by user
    await queryInterface.addIndex('shareable_links', ['user_id'], {
      name: 'shareable_link_user_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shareable_links');
  },
};
