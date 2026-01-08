'use strict';

// Fixed UUIDs for cross-seeder references (must be valid hex: 0-9, a-f)
const USER_IDS = {
  MARIO_ROSSI: 'a5e00001-0001-0001-0001-000000000001',
  GIULIA_BIANCHI: 'a5e00001-0001-0001-0001-000000000002',
  LUCA_VERDI: 'a5e00001-0001-0001-0001-000000000003',
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      // Full registration user (€10+ threshold reached, Corsair Connect enabled)
      {
        id: USER_IDS.MARIO_ROSSI,
        email: 'mario.rossi@test.com',
        first_name: 'Mario',
        last_name: 'Rossi',
        date_of_birth: new Date('1985-06-15'),
        street: 'Via Roma 123',
        city: 'Milan',
        postal_code: '20100',
        country: 'Italy',
        state: 'Lombardy',
        registration_level: 'full',
        corsair_connect_flag: true,
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Full registration user (€10+ threshold reached)
      {
        id: USER_IDS.GIULIA_BIANCHI,
        email: 'giulia.bianchi@test.com',
        first_name: 'Giulia',
        last_name: 'Bianchi',
        date_of_birth: new Date('1990-03-22'),
        street: 'Via Dante 45',
        city: 'Rome',
        postal_code: '00100',
        country: 'Italy',
        state: 'Lazio',
        registration_level: 'full',
        corsair_connect_flag: true,
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Minimal registration user (below €10 threshold, accumulation phase)
      {
        id: USER_IDS.LUCA_VERDI,
        email: 'luca.verdi@test.com',
        first_name: null,
        last_name: null,
        date_of_birth: null,
        street: null,
        city: null,
        postal_code: null,
        country: null,
        state: null,
        registration_level: 'minimal',
        corsair_connect_flag: false,
        terms_accepted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ Users seeded');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },

  // Export IDs for other seeders
  USER_IDS,
};
