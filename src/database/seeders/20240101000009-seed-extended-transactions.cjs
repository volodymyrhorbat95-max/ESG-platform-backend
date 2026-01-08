'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all necessary IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const skus = await queryInterface.sequelize.query(
      `SELECT id, code, price, "paymentMode", "impactMultiplier" FROM skus;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const merchants = await queryInterface.sequelize.query(
      `SELECT id, name FROM merchants;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const partners = await queryInterface.sequelize.query(
      `SELECT id, name FROM partners;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const giftCards = await queryInterface.sequelize.query(
      `SELECT id, code, "skuId" FROM gift_card_codes WHERE "isRedeemed" = false LIMIT 3;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Helper to find by code
    const getSKU = (code) => skus.find(s => s.code === code);
    const getUser = (email) => users.find(u => u.email === email);
    const getMerchant = (name) => merchants.find(m => m.name === name);
    const getPartner = (name) => partners.find(p => p.name === name);

    // CSR Price for calculations
    const CURRENT_CSR_PRICE = 0.11;
    const MASTER_ID = 'MARCELLO-MASTER-001';

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const transactions = [];

    // ============================================
    // SCENARIO 1: User crossing €10 threshold with multiple transactions
    // ============================================
    const marioId = getUser('mario.rossi@test.com')?.id;
    const conadId = getMerchant('Conad Supermarket')?.id;

    if (marioId) {
      // Transaction 1: €3 CLAIM (below threshold)
      const claimSku = getSKU('PROMO-GENERAL');
      if (claimSku) {
        transactions.push({
          id: uuidv4(),
          userId: marioId,
          skuId: claimSku.id,
          masterId: MASTER_ID,
          merchantId: conadId,
          partnerId: null,
          orderId: `ORD-${Date.now()}-001`,
          amount: 3.00,
          calculatedImpact: (3.00 / CURRENT_CSR_PRICE * 1000).toFixed(2), // 27,272.73g
          paymentStatus: 'n/a',
          stripePaymentIntentId: null,
          giftCardCodeId: null,
          corsairConnectFlag: false, // Still below €10
          createdAt: oneMonthAgo,
          updatedAt: oneMonthAgo,
        });
      }

      // Transaction 2: €4 CLAIM (below threshold, total = €7)
      if (claimSku) {
        transactions.push({
          id: uuidv4(),
          userId: marioId,
          skuId: claimSku.id,
          masterId: MASTER_ID,
          merchantId: conadId,
          partnerId: null,
          orderId: `ORD-${Date.now()}-002`,
          amount: 4.00,
          calculatedImpact: (4.00 / CURRENT_CSR_PRICE * 1000).toFixed(2), // 36,363.64g
          paymentStatus: 'n/a',
          stripePaymentIntentId: null,
          giftCardCodeId: null,
          corsairConnectFlag: false, // Still below €10
          createdAt: twoWeeksAgo,
          updatedAt: twoWeeksAgo,
        });
      }

      // Transaction 3: €5 ALLOCATION (crosses threshold! total = €12)
      const allocSku = getSKU('ALLOC-MERCHANT-5');
      if (allocSku) {
        transactions.push({
          id: uuidv4(),
          userId: marioId,
          skuId: allocSku.id,
          masterId: MASTER_ID,
          merchantId: conadId,
          partnerId: getPartner('Aware Growth')?.id,
          orderId: `ORD-${Date.now()}-003`,
          amount: 5.00,
          calculatedImpact: (5.00 * 1.6 * 1000).toFixed(2), // 8,000g (ALLOCATION formula)
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: null,
          corsairConnectFlag: true, // NOW CROSSES THRESHOLD!
          createdAt: oneWeekAgo,
          updatedAt: oneWeekAgo,
        });
      }
    }

    // ============================================
    // SCENARIO 2: Exact €10 threshold transaction
    // ============================================
    const giuliaId = getUser('giulia.bianchi@test.com')?.id;

    if (giuliaId) {
      const gc10 = getSKU('GC-10EUR');
      const giftCard = giftCards.find(gc => gc.skuId === gc10?.id);

      if (gc10 && giftCard) {
        transactions.push({
          id: uuidv4(),
          userId: giuliaId,
          skuId: gc10.id,
          masterId: MASTER_ID,
          merchantId: getMerchant('Giannetto Gift Cards')?.id,
          partnerId: null,
          orderId: `ORD-${Date.now()}-004`,
          amount: 10.00, // EXACTLY €10
          calculatedImpact: (10.00 / CURRENT_CSR_PRICE * 1000).toFixed(2), // 90,909.09g
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: giftCard.id,
          corsairConnectFlag: true, // Should be TRUE at exactly €10
          createdAt: threeDaysAgo,
          updatedAt: threeDaysAgo,
        });

        // Mark gift card as redeemed
        await queryInterface.bulkUpdate('gift_card_codes',
          {
            isRedeemed: true,
            redeemedAt: threeDaysAgo,
            redeemedBy: giuliaId,
            updatedAt: threeDaysAgo,
          },
          { id: giftCard.id }
        );
      }
    }

    // ============================================
    // SCENARIO 3: Failed payment (PAY mode)
    // ============================================
    const lucaId = getUser('luca.verdi@test.com')?.id;

    if (lucaId) {
      const pastaSku = getSKU('PASTA-ARTISAN-01');
      if (pastaSku) {
        transactions.push({
          id: uuidv4(),
          userId: lucaId,
          skuId: pastaSku.id,
          masterId: MASTER_ID,
          merchantId: getMerchant('Artisan Pasta Deli')?.id,
          partnerId: null,
          orderId: `ORD-${Date.now()}-005`,
          amount: 2.50,
          calculatedImpact: (2.50 / CURRENT_CSR_PRICE * 1000).toFixed(2), // 22,727.27g
          paymentStatus: 'failed', // FAILED PAYMENT
          stripePaymentIntentId: 'pi_test_failed_12345',
          giftCardCodeId: null,
          corsairConnectFlag: false,
          createdAt: yesterday,
          updatedAt: yesterday,
        });
      }
    }

    // ============================================
    // SCENARIO 4: Multiple ALLOCATION transactions with partner attribution
    // ============================================
    const altromercatoId = getMerchant('Altromercato')?.id;
    const ecoAllianceId = getPartner('Eco Alliance Network')?.id;

    if (giuliaId && altromercatoId && ecoAllianceId) {
      const allocEcom = getSKU('ALLOC-ECOM-01');
      if (allocEcom) {
        // €20 allocation
        transactions.push({
          id: uuidv4(),
          userId: giuliaId,
          skuId: allocEcom.id,
          masterId: MASTER_ID,
          merchantId: altromercatoId,
          partnerId: ecoAllianceId,
          orderId: `ORD-${Date.now()}-006`,
          amount: 20.00,
          calculatedImpact: (20.00 * 1.6 * 1000).toFixed(2), // 32,000g
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: null,
          corsairConnectFlag: true,
          createdAt: threeDaysAgo,
          updatedAt: threeDaysAgo,
        });

        // €50 allocation (high value)
        transactions.push({
          id: uuidv4(),
          userId: giuliaId,
          skuId: allocEcom.id,
          masterId: MASTER_ID,
          merchantId: altromercatoId,
          partnerId: ecoAllianceId,
          orderId: `ORD-${Date.now()}-007`,
          amount: 50.00,
          calculatedImpact: (50.00 * 1.6 * 1000).toFixed(2), // 80,000g
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: null,
          corsairConnectFlag: true,
          createdAt: yesterday,
          updatedAt: yesterday,
        });
      }
    }

    // ============================================
    // SCENARIO 5: Pending payment (webhook not yet received)
    // ============================================
    if (lucaId) {
      const pastaSku = getSKU('PASTA-ARTISAN-01');
      if (pastaSku) {
        transactions.push({
          id: uuidv4(),
          userId: lucaId,
          skuId: pastaSku.id,
          masterId: MASTER_ID,
          merchantId: getMerchant('Artisan Pasta Deli')?.id,
          partnerId: null,
          orderId: `ORD-${Date.now()}-008`,
          amount: 2.50,
          calculatedImpact: (2.50 / CURRENT_CSR_PRICE * 1000).toFixed(2), // 22,727.27g
          paymentStatus: 'pending', // WAITING FOR WEBHOOK
          stripePaymentIntentId: 'pi_test_pending_67890',
          giftCardCodeId: null,
          corsairConnectFlag: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // ============================================
    // SCENARIO 6: €9.99 vs €10.01 threshold edge cases
    // ============================================
    if (marioId) {
      const gc5 = getSKU('GC-5EUR');
      const giftCard1 = giftCards[1];

      if (gc5 && giftCard1) {
        // €9.99 - should NOT trigger corsairConnectFlag
        transactions.push({
          id: uuidv4(),
          userId: marioId,
          skuId: gc5.id,
          masterId: MASTER_ID,
          merchantId: getMerchant('Giannetto Gift Cards')?.id,
          partnerId: null,
          orderId: `ORD-${Date.now()}-009`,
          amount: 9.99,
          calculatedImpact: (9.99 / CURRENT_CSR_PRICE * 1000).toFixed(2), // 90,818.18g
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: giftCard1.id,
          corsairConnectFlag: false, // Just below threshold
          createdAt: oneWeekAgo,
          updatedAt: oneWeekAgo,
        });

        await queryInterface.bulkUpdate('gift_card_codes',
          {
            isRedeemed: true,
            redeemedAt: oneWeekAgo,
            redeemedBy: marioId,
            updatedAt: oneWeekAgo,
          },
          { id: giftCard1.id }
        );
      }

      // €10.01 - SHOULD trigger corsairConnectFlag
      const giftCard2 = giftCards[2];
      if (gc5 && giftCard2) {
        transactions.push({
          id: uuidv4(),
          userId: marioId,
          skuId: gc5.id,
          masterId: MASTER_ID,
          merchantId: getMerchant('Giannetto Gift Cards')?.id,
          partnerId: null,
          orderId: `ORD-${Date.now()}-010`,
          amount: 10.01,
          calculatedImpact: (10.01 / CURRENT_CSR_PRICE * 1000).toFixed(2), // 91,000g
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: giftCard2.id,
          corsairConnectFlag: true, // Just above threshold
          createdAt: yesterday,
          updatedAt: yesterday,
        });

        await queryInterface.bulkUpdate('gift_card_codes',
          {
            isRedeemed: true,
            redeemedAt: yesterday,
            redeemedBy: marioId,
            updatedAt: yesterday,
          },
          { id: giftCard2.id }
        );
      }
    }

    // ============================================
    // SCENARIO 7: High-value transactions (€100+)
    // ============================================
    if (giuliaId) {
      const allocSku15 = getSKU('ALLOC-MERCHANT-15');
      const greenBusinessId = getPartner('Green Business Coalition')?.id;

      if (allocSku15) {
        // €100 enterprise allocation
        transactions.push({
          id: uuidv4(),
          userId: giuliaId,
          skuId: allocSku15.id,
          masterId: MASTER_ID,
          merchantId: altromercatoId,
          partnerId: greenBusinessId,
          orderId: `ORD-${Date.now()}-011`,
          amount: 100.00,
          calculatedImpact: (100.00 * 1.6 * 1000).toFixed(2), // 160,000g (160 kg!)
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: null,
          corsairConnectFlag: true,
          createdAt: oneMonthAgo,
          updatedAt: oneMonthAgo,
        });

        // €250 corporate allocation
        transactions.push({
          id: uuidv4(),
          userId: giuliaId,
          skuId: allocSku15.id,
          masterId: MASTER_ID,
          merchantId: altromercatoId,
          partnerId: greenBusinessId,
          orderId: `ORD-${Date.now()}-012`,
          amount: 250.00,
          calculatedImpact: (250.00 * 1.6 * 1000).toFixed(2), // 400,000g (400 kg!!)
          paymentStatus: 'completed',
          stripePaymentIntentId: null,
          giftCardCodeId: null,
          corsairConnectFlag: true,
          createdAt: twoWeeksAgo,
          updatedAt: twoWeeksAgo,
        });
      }
    }

    // Insert all transactions
    if (transactions.length > 0) {
      await queryInterface.bulkInsert('transactions', transactions, {});
      console.log(`✅ ${transactions.length} extended scenario transactions seeded successfully`);
      console.log('   - Threshold crossing scenarios');
      console.log('   - Exact €10 threshold');
      console.log('   - Failed payments');
      console.log('   - Pending payments');
      console.log('   - Partner attributions');
      console.log('   - High-value transactions');
      console.log('   - Edge cases (€9.99 vs €10.01)');
    }
  },

  async down(queryInterface, Sequelize) {
    // Delete only transactions created by this seeder
    // (You might want to add a tag field to identify seeder-created transactions)
    await queryInterface.bulkDelete('transactions',
      {
        orderId: {
          [Sequelize.Op.like]: 'ORD-%'
        }
      },
      {}
    );
  }
};
