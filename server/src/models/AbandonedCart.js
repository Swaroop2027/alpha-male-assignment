import mongoose from 'mongoose';

const abandonedCartSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    customerName: { type: String, default: 'Shopper' },
    email: { type: String, default: '' },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: String,
        price: Number,
        quantity: Number,
        image: String
      }
    ],
    cartTotal: { type: Number, required: true },
    utm: {
      source: String,
      medium: String,
      campaign: String
    },
    isRecovered: { type: Boolean, default: false },
    followUpStatus: {
      type: String,
      enum: ['Pending', 'Called', 'Messaged', 'Recovered', 'Unresponsive'],
      default: 'Pending'
    },
    lastActivityAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const AbandonedCart = mongoose.model('AbandonedCart', abandonedCartSchema);
export default AbandonedCart;