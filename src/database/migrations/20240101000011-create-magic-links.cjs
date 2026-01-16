'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'magic_links');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
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
    }

    // Use IF NOT EXISTS for indexes to make migration idempotent
    // Note: The unique constraint on 'token' column already creates an index,
    // so we only add the additional indexes that aren't auto-created

    // Add index on expires_at for cleanup queries (if not exists)
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_magic_links_expires_at" ON "magic_links" ("expires_at");`
    );

    // Add index on user_id (if not exists)
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_magic_links_user_id" ON "magic_links" ("user_id");`
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('magic_links');
  }
};
