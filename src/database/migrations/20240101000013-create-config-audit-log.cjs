'use strict';

/**
 * ConfigAuditLog Migration
 * Section 9.2: Admin Panel - Change history/audit log for global configuration
 *
 * Purpose: Track all changes to global configuration settings for accountability
 * and compliance purposes.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'config_audit_log');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('config_audit_log', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        config_key: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Configuration key that was changed (e.g., CURRENT_CSR_PRICE)',
        },
        old_value: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Previous value (null for new config)',
        },
        new_value: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'New value after change',
        },
        changed_by: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Admin user who made the change (email or ID)',
        },
        changed_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: 'Timestamp when the change was made',
        },
      });
    }

    // Use IF NOT EXISTS for indexes to make migration idempotent
    // Index on config_key for filtering by configuration
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_config_audit_log_config_key" ON "config_audit_log" ("config_key");`
    );

    // Index on changed_at for time-based queries
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_config_audit_log_changed_at" ON "config_audit_log" ("changed_at");`
    );

    // Index on changed_by for admin activity tracking
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_config_audit_log_changed_by" ON "config_audit_log" ("changed_by");`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('config_audit_log');
  },
};
