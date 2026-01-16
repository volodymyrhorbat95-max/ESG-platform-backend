'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('global_config', [
      {
        id: uuidv4(),
        key: 'CURRENT_CSR_PRICE',
        value: '0.11',
        description: 'Current price per kilogram of plastic removal in euros. Used for impact calculation: Impact (kg) = Amount (€) / CURRENT_CSR_PRICE',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        key: 'MASTER_ID',
        value: 'MARCELLO-MASTER-001',
        description: 'Master ID for overall network tracking and attribution',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        key: 'PLATFORM_FEE_PERCENTAGE',
        value: '0.10',
        description: 'Platform fee percentage for Stripe split payments (PAY mode) - stored as decimal (e.g., 0.10 for 10%)',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        key: 'CORSAIR_THRESHOLD',
        value: '10.00',
        description: 'Minimum transaction amount in euros to trigger Corsair Connect flag and certified asset status',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        key: 'ALLOCATION_MULTIPLIER',
        value: '1.0',
        description: 'DEPRECATED: No longer used. All payment modes now use the same formula: (amount / CURRENT_CSR_PRICE) * impactMultiplier. Per client clarification: "€1 generates 9,090 grams of removal. 1/0.11"',
        created_at: now,
        updated_at: now,
      },
    ], {});

    console.log('✅ Global configuration seeded successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('global_config', null, {});
  }
};
