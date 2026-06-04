// models.js
import { Schema, model } from 'mongoose';

// Product Data Schema Structure
const ProductSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 }
}, { timestamps: true });

// User Data Schema Structure containing an embedded Cart array matrix
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cart: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 }
    }]
}, { timestamps: true });

// Order Schema Tracking for complete historical receipts
const OrderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, default: 'Pending Payment' },
    paymentDetails: {
        transactionId: { type: String },
        gateway: { type: String },
        paidAt: { type: Date }
    }
}, { timestamps: true });

export const Product = model('Product', ProductSchema);
export const User = model('User', UserSchema);
export const Order = model('Order', OrderSchema);