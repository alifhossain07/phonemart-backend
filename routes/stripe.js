const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDB } = require('../config/database');
const { toObjectId } = require('../utils/helpers');

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'bdt', order_data } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        result: false,
        message: 'Invalid amount'
      });
    }

    // Convert amount to smallest currency unit (paisa for BDT)
    // Stripe expects amount in smallest currency unit
    const amountInPaisa = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: currency.toLowerCase(),
      metadata: {
        order_data: JSON.stringify(order_data || {})
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.json({
      result: true,
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return res.status(500).json({
      result: false,
      success: false,
      message: error.message || 'Failed to create payment intent'
    });
  }
});

// Webhook route moved to separate file (stripeWebhook.js) for proper middleware handling

// Verify payment status
router.get('/verify-payment/:payment_intent_id', async (req, res) => {
  try {
    const { payment_intent_id } = req.params;

    if (!payment_intent_id) {
      return res.status(400).json({
        result: false,
        message: 'Payment intent ID is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    return res.json({
      result: true,
      success: true,
      payment_status: paymentIntent.status,
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    console.error('Stripe verify payment error:', error);
    return res.status(500).json({
      result: false,
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
});

// Sync payment status - manually update order if webhook didn't fire
router.post('/sync-payment-status', async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({
        result: false,
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    console.log('=== MANUAL SYNC PAYMENT STATUS ===');
    console.log('Payment Intent ID:', payment_intent_id);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    console.log('Payment Intent Status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return res.json({
        result: true,
        success: true,
        message: `Payment status is ${paymentIntent.status}, not succeeded`,
        payment_status: paymentIntent.status
      });
    }

    // Extract order data from metadata
    const orderDataStr = paymentIntent.metadata?.order_data;
    if (!orderDataStr) {
      return res.status(400).json({
        result: false,
        success: false,
        message: 'No order data found in payment intent metadata'
      });
    }

    const orderData = JSON.parse(orderDataStr);
    const db = getDB();

    if (!orderData.order_id) {
      return res.status(400).json({
        result: false,
        success: false,
        message: 'No order_id in payment intent metadata'
      });
    }

    const orderId = toObjectId(orderData.order_id);
    const order = await db.collection('orders').findOne({ _id: orderId });

    if (!order) {
      return res.status(404).json({
        result: false,
        success: false,
        message: 'Order not found'
      });
    }

    // Check if already paid
    if (order.payment_status === 'paid') {
      return res.json({
        result: true,
        success: true,
        message: 'Order is already marked as paid',
        payment_status: 'paid'
      });
    }

    // Update order payment status
    await db.collection('orders').updateOne(
      { _id: orderId },
      {
        $set: {
          payment_status: 'paid',
          payment_intent_id: paymentIntent.id,
          stripe_payment_id: paymentIntent.id,
          updated_at: new Date()
        }
      }
    );

    // Reduce product stock
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const productId = toObjectId(item.id);
        if (productId) {
          try {
            await db.collection('products').updateOne(
              { _id: productId },
              { $inc: { current_stock: -(parseInt(item.qty) || 1) } }
            );
          } catch (stockError) {
            console.error(`Failed to update stock for product ${item.id}:`, stockError);
          }
        }
      }
    }

    console.log(`✅ Order ${orderData.order_id} (${order.order_code}) payment status synced to paid`);

    return res.json({
      result: true,
      success: true,
      message: 'Payment status updated successfully',
      payment_status: 'paid',
      order_code: order.order_code
    });
  } catch (error) {
    console.error('Sync payment status error:', error);
    return res.status(500).json({
      result: false,
      success: false,
      message: error.message || 'Failed to sync payment status'
    });
  }
});

module.exports = router;
