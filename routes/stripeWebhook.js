const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDB } = require('../config/database');
const { toObjectId } = require('../utils/helpers');

const router = express.Router();

// Stripe webhook endpoint for payment confirmation
// This route should be registered with express.raw() middleware and WITHOUT systemKeyMiddleware
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Webhook secret exists:', !!webhookSecret);
  console.log('Signature exists:', !!sig);

  let event;

  try {
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
      return res.status(500).send('Webhook secret not configured');
    }

    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('Webhook event type:', event.type);
    console.log('Webhook event ID:', event.id);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    console.error('Error details:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('=== PAYMENT INTENT SUCCEEDED ===');
    console.log('PaymentIntent ID:', paymentIntent.id);
    console.log('PaymentIntent status:', paymentIntent.status);
    console.log('PaymentIntent metadata:', JSON.stringify(paymentIntent.metadata, null, 2));

    // Extract order data from metadata
    const orderDataStr = paymentIntent.metadata?.order_data;
    console.log('Order data string:', orderDataStr);
    
    if (orderDataStr) {
      try {
        const orderData = JSON.parse(orderDataStr);
        console.log('Parsed order data:', JSON.stringify(orderData, null, 2));
        const db = getDB();

        // Update order payment status
        if (orderData.order_id) {
          const orderId = toObjectId(orderData.order_id);
          console.log('Looking for order with ID:', orderData.order_id);
          console.log('Converted ObjectId:', orderId);
          
          // Get the order to reduce stock
          const order = await db.collection('orders').findOne({ _id: orderId });
          
          if (order) {
            console.log('Order found:', order.order_code);
            
            // Update order payment status
            const updateResult = await db.collection('orders').updateOne(
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
            
            console.log('Update result:', updateResult.modifiedCount, 'documents modified');
            
            // Reduce product stock now that payment is confirmed
            if (order.items && Array.isArray(order.items)) {
              console.log('Reducing stock for', order.items.length, 'items');
              for (const item of order.items) {
                const productId = toObjectId(item.id);
                if (productId) {
                  try {
                    await db.collection('products').updateOne(
                      { _id: productId },
                      { $inc: { current_stock: -(parseInt(item.qty) || 1) } }
                    );
                    console.log(`Stock reduced for product ${item.id}`);
                  } catch (stockError) {
                    console.error(`Failed to update stock for product ${item.id}:`, stockError);
                  }
                }
              }
            }
            
            console.log(`✅ Order ${orderData.order_id} (${order.order_code}) payment confirmed and stock updated`);
          } else {
            console.error(`❌ Order not found with ID: ${orderData.order_id}`);
          }
        } else {
          console.error('❌ No order_id in order_data');
        }
      } catch (parseError) {
        console.error('❌ Error parsing order data from webhook:', parseError);
        console.error('Parse error stack:', parseError.stack);
      }
    } else {
      console.error('❌ No order_data in payment intent metadata');
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log('PaymentIntent failed:', paymentIntent.id);

    // Update order payment status to failed
    const orderDataStr = paymentIntent.metadata?.order_data;
    if (orderDataStr) {
      try {
        const orderData = JSON.parse(orderDataStr);
        const db = getDB();

        if (orderData.order_id) {
          await db.collection('orders').updateOne(
            { _id: toObjectId(orderData.order_id) },
            {
              $set: {
                payment_status: 'failed',
                updated_at: new Date()
              }
            }
          );
          console.log(`Order ${orderData.order_id} payment failed`);
        }
      } catch (parseError) {
        console.error('Error parsing order data from webhook:', parseError);
      }
    }
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

module.exports = router;
