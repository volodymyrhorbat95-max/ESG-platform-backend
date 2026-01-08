'use strict';

// Fixed UUIDs for cross-seeder references
const PARTNER_IDS = {
  AWARE_GROWTH: '11111111-1111-1111-1111-111111111111',
  ECO_ALLIANCE: '22222222-2222-2222-2222-222222222222',
  GREEN_BIZ: '33333333-3333-3333-3333-333333333333',
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('partners', [
      {
        id: PARTNER_IDS.AWARE_GROWTH,
        name: 'Aware Growth',
        email: 'billing@awaregrowth.com',
        contact_person: 'Marco Bianchi',
        phone: '+39 02 1234 5678',
        billing_address: 'Via Milano 100, 20100 Milan, Italy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: PARTNER_IDS.ECO_ALLIANCE,
        name: 'Eco Alliance Network',
        email: 'partnerships@ecoalliance.eu',
        contact_person: 'Sofia Ricci',
        phone: '+39 06 9876 5432',
        billing_address: 'Corso Vittorio Emanuele 250, 00186 Rome, Italy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: PARTNER_IDS.GREEN_BIZ,
        name: 'Green Business Coalition',
        email: 'info@greenbiz.org',
        contact_person: 'Alessandro Verdi',
        phone: '+39 011 5555 7777',
        billing_address: 'Via Po 45, 10123 Turin, Italy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ Partners seeded');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('partners', null, {});
  },

  // Export IDs for other seeders
  PARTNER_IDS,
};
