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
        skuId: lotConad.id,
        locale: 'de-DE',
        localizedName: 'Conad Lot-Anspruch 1:1',
        localizedDescription: 'Conad Supermarkt hat für Sie Plastikentfernung vorausbezahlt. Ihr Einkauf trägt zur zertifizierten Umweltwirkung bei.',
        localizedTerminology: 'Umweltvermögen',
        currency: 'EUR',
        localizedPrice: parseFloat(lotConad.price),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // GC-25EUR
    const gc25 = getSKU('GC-25EUR');
    if (gc25) {
      localizations.push({
        id: uuidv4(),
        skuId: gc25.id,
        locale: 'de-DE',
        localizedName: 'Geschenkkarte 25€',
        localizedDescription: 'Lösen Sie Ihren geheimen Code ein und erhalten Sie ein zertifiziertes Umweltvermögen für 227,3 kg entferntes Plastik.',
        localizedTerminology: 'Zertifiziertes Umweltvermögen',
        currency: 'EUR',
        localizedPrice: 25.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ALLOC-MERCHANT-5
    const alloc5 = getSKU('ALLOC-MERCHANT-5');
    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        skuId: alloc5.id,
        locale: 'de-DE',
        localizedName: 'Umweltzuweisung 5€',
        localizedDescription: 'Ihr Beitrag von 5€ generiert 8 kg zertifizierte Plastikentfernung. Bauen Sie Ihr Portfolio an Umweltvermögen auf.',
        localizedTerminology: 'Umweltzuweisung',
        currency: 'EUR',
        localizedPrice: 5.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // PASTA-ARTISAN-01
    const pasta = getSKU('PASTA-ARTISAN-01');
    if (pasta) {
      localizations.push({
        id: uuidv4(),
        skuId: pasta.id,
        locale: 'de-DE',
        localizedName: 'Handwerkliche Pasta',
        localizedDescription: 'Kaufen Sie nachhaltige handwerkliche Pasta und tragen Sie zu 22,7 kg Plastikentfernung bei. Unterstützt lokale Delikatessenhändler.',
        localizedTerminology: 'Umweltwirkung',
        currency: 'EUR',
        localizedPrice: 2.50,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ============================================
    // FRENCH (fr-FR) LOCALIZATIONS
    // ============================================

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        skuId: gc25.id,
        locale: 'fr-FR',
        localizedName: 'Carte Cadeau 25€',
        localizedDescription: 'Échangez votre code secret et recevez un actif environnemental certifié pour 227,3 kg de plastique retiré.',
        localizedTerminology: 'Actif Environnemental Certifié',
        currency: 'EUR',
        localizedPrice: 25.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        skuId: alloc5.id,
        locale: 'fr-FR',
        localizedName: 'Allocation Environnementale 5€',
        localizedDescription: 'Votre contribution de 5€ génère 8 kg de retrait de plastique certifié. Construisez votre portefeuille d\'actifs environnementaux.',
        localizedTerminology: 'Allocation Environnementale',
        currency: 'EUR',
        localizedPrice: 5.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ============================================
    // ENGLISH (en-US) LOCALIZATIONS
    // ============================================

    if (lotConad) {
      localizations.push({
        id: uuidv4(),
        skuId: lotConad.id,
        locale: 'en-US',
        localizedName: 'Conad Lot Claim 1:1',
        localizedDescription: 'Conad Supermarket has pre-funded plastic removal for you. Your purchase contributes to certified environmental impact.',
        localizedTerminology: 'Environmental Asset',
        currency: 'USD',
        localizedPrice: 0.0021, // Approximate USD conversion
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        skuId: gc25.id,
        locale: 'en-US',
        localizedName: 'Gift Card $27',
        localizedDescription: 'Redeem your secret code and receive a certified environmental asset for 227.3 kg of plastic removed.',
        localizedTerminology: 'Certified Environmental Asset',
        currency: 'USD',
        localizedPrice: 27.00, // ~25 EUR
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const alloc15 = getSKU('ALLOC-MERCHANT-15');
    if (alloc15) {
      localizations.push({
        id: uuidv4(),
        skuId: alloc15.id,
        locale: 'en-US',
        localizedName: 'Environmental Allocation $16',
        localizedDescription: 'Your $16 contribution generates 24 kg of certified plastic removal. Build your environmental asset portfolio.',
        localizedTerminology: 'Environmental Allocation',
        currency: 'USD',
        localizedPrice: 16.00, // ~15 EUR
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (pasta) {
      localizations.push({
        id: uuidv4(),
        skuId: pasta.id,
        locale: 'en-US',
        localizedName: 'Artisan Pasta',
        localizedDescription: 'Purchase sustainable artisan pasta and contribute to 22.7 kg of plastic removal. Supports local delis.',
        localizedTerminology: 'Environmental Impact',
        currency: 'USD',
        localizedPrice: 2.75, // ~2.50 EUR
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ============================================
    // SPANISH (es-ES) LOCALIZATIONS
    // ============================================

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        skuId: gc25.id,
        locale: 'es-ES',
        localizedName: 'Tarjeta Regalo 25€',
        localizedDescription: 'Canjea tu código secreto y recibe un activo ambiental certificado por 227,3 kg de plástico eliminado.',
        localizedTerminology: 'Activo Ambiental Certificado',
        currency: 'EUR',
        localizedPrice: 25.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        skuId: alloc5.id,
        locale: 'es-ES',
        localizedName: 'Asignación Ambiental 5€',
        localizedDescription: 'Tu contribución de 5€ genera 8 kg de eliminación de plástico certificada. Construye tu cartera de activos ambientales.',
        localizedTerminology: 'Asignación Ambiental',
        currency: 'EUR',
        localizedPrice: 5.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ============================================
    // ITALIAN (it-IT) LOCALIZATIONS - Native language
    // ============================================

    if (lotConad) {
      localizations.push({
        id: uuidv4(),
        skuId: lotConad.id,
        locale: 'it-IT',
        localizedName: 'Lotto Conad Prepagato 1:1',
        localizedDescription: 'Conad ha prepagato la rimozione della plastica per te. Il tuo acquisto contribuisce all\'impatto ambientale certificato.',
        localizedTerminology: 'Patrimonio Ambientale',
        currency: 'EUR',
        localizedPrice: parseFloat(lotConad.price),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (gc25) {
      localizations.push({
        id: uuidv4(),
        skuId: gc25.id,
        locale: 'it-IT',
        localizedName: 'Carta Regalo 25€',
        localizedDescription: 'Riscatta il tuo codice segreto e ricevi un patrimonio ambientale certificato per 227,3 kg di plastica rimossa.',
        localizedTerminology: 'Patrimonio Ambientale Certificato',
        currency: 'EUR',
        localizedPrice: 25.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (alloc5) {
      localizations.push({
        id: uuidv4(),
        skuId: alloc5.id,
        locale: 'it-IT',
        localizedName: 'Accantonamento Ambientale 5€',
        localizedDescription: 'Il tuo contributo di 5€ genera 8 kg di rimozione plastica certificata. Costruisci il tuo portafoglio di patrimonio ambientale.',
        localizedTerminology: 'Accantonamento Ambientale',
        currency: 'EUR',
        localizedPrice: 5.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (alloc15) {
      localizations.push({
        id: uuidv4(),
        skuId: alloc15.id,
        locale: 'it-IT',
        localizedName: 'Accantonamento Ambientale 15€',
        localizedDescription: 'Il tuo contributo di 15€ genera 24 kg di rimozione plastica certificata. Hai acquisito patrimonio ambientale reale, verificabile e garantito.',
        localizedTerminology: 'Patrimonio Ambientale Certificato',
        currency: 'EUR',
        localizedPrice: 15.00,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (pasta) {
      localizations.push({
        id: uuidv4(),
        skuId: pasta.id,
        locale: 'it-IT',
        localizedName: 'Pasta Artigianale',
        localizedDescription: 'Acquista pasta artigianale sostenibile e contribuisci a 22,7 kg di rimozione plastica. Sostieni le gastronomie locali.',
        localizedTerminology: 'Impatto Ambientale',
        currency: 'EUR',
        localizedPrice: 2.50,
        isActive: true,
        createdAt: now,
        updatedAt: now,
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
