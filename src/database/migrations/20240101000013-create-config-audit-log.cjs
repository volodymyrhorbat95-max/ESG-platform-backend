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

    // Index on config_key for filtering by configuration
    await queryInterface.addIndex('config_audit_log', ['config_key'], {
      name: 'idx_config_audit_log_config_key',
    });

    // Index on changed_at for time-based queries
    await queryInterface.addIndex('config_audit_log', ['changed_at'], {
      name: 'idx_config_audit_log_changed_at',
    });

    // Index on changed_by for admin activity tracking
    await queryInterface.addIndex('config_audit_log', ['changed_by'], {
      name: 'idx_config_audit_log_changed_by',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('config_audit_log');
  },
};
