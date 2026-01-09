'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all SKUs
    const skus = await queryInterface.sequelize.query(
      `SELECT id, code, name, price FROM skus;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const getSKU = (code) => skus.find(s => s.code === code);
    const now = new Date();
    const localizations = [];

    // ============================================
    // GERMAN (de-DE) LOCALIZATIONS
    // ============================================

    // LOT-CONAD-01
    const lotConad = getSKU('LOT-CONAD-01');
    if (lotConad) {
      localizations.push({
        id: uuidv4(),
        sku_id: lotConad.id,
        locale: 'de-DE',
        localized_name: 'Conad Lot-Anspruch 1:1',
        localized_description: 'Conad Supermarkt hat für Sie Plastikentfernung vorausbezahlt. Ihr Einkauf trägt zur zertifizierten Umweltwirkung bei.',
        localized_terminology: 'Umweltvermögen',
        currency: 'EUR',
        localized_price: parseFloat(lotConad.price),
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // GC-25EUR
    const gc25 = getSKU('GC-25EUR');
    if (gc25) {
      localizations.push({
        id: uuidv4(),
        sku_id: gc25.id,
        locale: 'de-DE',
        localized_name: 'Geschenkkarte 25€',
        localized_description: 'Lösen Sie Ihren geheimen Code ein und erhalten Sie ein zertifiziertes Umweltvermögen für 227,3 kg entferntes Plastik.',
        localized_terminology: 'Zertifiziertes Umweltvermögen',
        currency: 'EUR',
        localized_price: 25.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // ALLOC-MERCHANT-5
    const alloc5 = getSKU('ALLOC-MERCHANT-5');
    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        sku_id: alloc5.id,
        locale: 'de-DE',
        localized_name: 'Umweltzuweisung 5€',
        localized_description: 'Ihr Beitrag von 5€ generiert 8 kg zertifizierte Plastikentfernung. Bauen Sie Ihr Portfolio an Umweltvermögen auf.',
        localized_terminology: 'Umweltzuweisung',
        currency: 'EUR',
        localized_price: 5.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // PASTA-ARTISAN-01
    const pasta = getSKU('PASTA-ARTISAN-01');
    if (pasta) {
      localizations.push({
        id: uuidv4(),
        sku_id: pasta.id,
        locale: 'de-DE',
        localized_name: 'Handwerkliche Pasta',
        localized_description: 'Kaufen Sie nachhaltige handwerkliche Pasta und tragen Sie zu 22,7 kg Plastikentfernung bei. Unterstützt lokale Delikatessenhändler.',
        localized_terminology: 'Umweltwirkung',
        currency: 'EUR',
        localized_price: 2.50,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // ============================================
    // FRENCH (fr-FR) LOCALIZATIONS
    // ============================================

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        sku_id: gc25.id,
        locale: 'fr-FR',
        localized_name: 'Carte Cadeau 25€',
        localized_description: 'Échangez votre code secret et recevez un actif environnemental certifié pour 227,3 kg de plastique retiré.',
        localized_terminology: 'Actif Environnemental Certifié',
        currency: 'EUR',
        localized_price: 25.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        sku_id: alloc5.id,
        locale: 'fr-FR',
        localized_name: 'Allocation Environnementale 5€',
        localized_description: 'Votre contribution de 5€ génère 8 kg de retrait de plastique certifié. Construisez votre portefeuille d\'actifs environnementaux.',
        localized_terminology: 'Allocation Environnementale',
        currency: 'EUR',
        localized_price: 5.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // ============================================
    // ENGLISH (en-US) LOCALIZATIONS
    // ============================================

    if (lotConad) {
      localizations.push({
        id: uuidv4(),
        sku_id: lotConad.id,
        locale: 'en-US',
        localized_name: 'Conad Lot Claim 1:1',
        localized_description: 'Conad Supermarket has pre-funded plastic removal for you. Your purchase contributes to certified environmental impact.',
        localized_terminology: 'Environmental Asset',
        currency: 'USD',
        localized_price: 0.0021, // Approximate USD conversion
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        sku_id: gc25.id,
        locale: 'en-US',
        localized_name: 'Gift Card $27',
        localized_description: 'Redeem your secret code and receive a certified environmental asset for 227.3 kg of plastic removed.',
        localized_terminology: 'Certified Environmental Asset',
        currency: 'USD',
        localized_price: 27.00, // ~25 EUR
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    const alloc15 = getSKU('ALLOC-MERCHANT-15');
    if (alloc15) {
      localizations.push({
        id: uuidv4(),
        sku_id: alloc15.id,
        locale: 'en-US',
        localized_name: 'Environmental Allocation $16',
        localized_description: 'Your $16 contribution generates 24 kg of certified plastic removal. Build your environmental asset portfolio.',
        localized_terminology: 'Environmental Allocation',
        currency: 'USD',
        localized_price: 16.00, // ~15 EUR
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (pasta) {
      localizations.push({
        id: uuidv4(),
        sku_id: pasta.id,
        locale: 'en-US',
        localized_name: 'Artisan Pasta',
        localized_description: 'Purchase sustainable artisan pasta and contribute to 22.7 kg of plastic removal. Supports local delis.',
        localized_terminology: 'Environmental Impact',
        currency: 'USD',
        localized_price: 2.75, // ~2.50 EUR
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // ============================================
    // SPANISH (es-ES) LOCALIZATIONS
    // ============================================

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        sku_id: gc25.id,
        locale: 'es-ES',
        localized_name: 'Tarjeta Regalo 25€',
        localized_description: 'Canjea tu código secreto y recibe un activo ambiental certificado por 227,3 kg de plástico eliminado.',
        localized_terminology: 'Activo Ambiental Certificado',
        currency: 'EUR',
        localized_price: 25.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        sku_id: alloc5.id,
        locale: 'es-ES',
        localized_name: 'Asignación Ambiental 5€',
        localized_description: 'Tu contribución de 5€ genera 8 kg de eliminación de plástico certificada. Construye tu cartera de activos ambientales.',
        localized_terminology: 'Asignación Ambiental',
        currency: 'EUR',
        localized_price: 5.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // ============================================
    // ITALIAN (it-IT) LOCALIZATIONS - Native language
    // ============================================

    if (lotConad) {
      localizations.push({
        id: uuidv4(),
        sku_id: lotConad.id,
        locale: 'it-IT',
        localized_name: 'Lotto Conad Prepagato 1:1',
        localized_description: 'Conad ha prepagato la rimozione della plastica per te. Il tuo acquisto contribuisce all\'impatto ambientale certificato.',
        localized_terminology: 'Patrimonio Ambientale',
        currency: 'EUR',
        localized_price: parseFloat(lotConad.price),
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        sku_id: gc25.id,
        locale: 'it-IT',
        localized_name: 'Carta Regalo 25€',
        localized_description: 'Riscatta il tuo codice segreto e ricevi un patrimonio ambientale certificato per 227,3 kg di plastica rimossa.',
        localized_terminology: 'Patrimonio Ambientale Certificato',
        currency: 'EUR',
        localized_price: 25.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        sku_id: alloc5.id,
        locale: 'it-IT',
        localized_name: 'Accantonamento Ambientale 5€',
        localized_description: 'Il tuo contributo di 5€ genera 8 kg di rimozione plastica certificata. Costruisci il tuo portafoglio di patrimonio ambientale.',
        localized_terminology: 'Accantonamento Ambientale',
        currency: 'EUR',
        localized_price: 5.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (alloc15) {
      localizations.push({
        id: uuidv4(),
        sku_id: alloc15.id,
        locale: 'it-IT',
        localized_name: 'Accantonamento Ambientale 15€',
        localized_description: 'Il tuo contributo di 15€ genera 24 kg di rimozione plastica certificata. Hai acquisito patrimonio ambientale reale, verificabile e garantito.',
        localized_terminology: 'Patrimonio Ambientale Certificato',
        currency: 'EUR',
        localized_price: 15.00,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (pasta) {
      localizations.push({
        id: uuidv4(),
        sku_id: pasta.id,
        locale: 'it-IT',
        localized_name: 'Pasta Artigianale',
        localized_description: 'Acquista pasta artigianale sostenibile e contribuisci a 22,7 kg di rimozione plastica. Sostieni le gastronomie locali.',
        localized_terminology: 'Impatto Ambientale',
        currency: 'EUR',
        localized_price: 2.50,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // Insert all localizations
    if (localizations.length > 0) {
      await queryInterface.bulkInsert('sku_localizations', localizations, {});
      console.log(`✅ ${localizations.length} SKU localizations seeded successfully`);
      console.log('   Locales: de-DE (German), fr-FR (French), en-US (English), es-ES (Spanish), it-IT (Italian)');
      console.log('   SKUs localized: LOT-CONAD-01, GC-25EUR, ALLOC-MERCHANT-5, ALLOC-MERCHANT-15, PASTA-ARTISAN-01');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sku_localizations', null, {});
  }
};
