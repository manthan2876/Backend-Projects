// shopService.js
import { Product, User, Order } from './models.js';

/**
 * Gathers product arrays filtering out properties dynamically by category search or text matching queries.
 */
async function getCatalog(categoryFilter = null, searchKeyword = null) {
    const query = {};

    if (categoryFilter) {
        query.category = categoryFilter;
    }

    if (searchKeyword) {
        // Enforces case-insensitive wildcard pattern match across names or descriptions
        query.$or = [
            { name: { $regex: searchKeyword, $options: 'i' } },
            { description: { $regex: searchKeyword, $options: 'i' } }
        ];
    }

    return await Product.find(query);
}

/**
 * Modifies an isolated user context cart schema array, linking items and verifying counts.
 */
async function appendToCart(userId, { productId, quantity }) {
    if (!productId || !quantity || quantity <= 0) {
        throw new Error('Invalid product specifications or quantity payload selection.');
    }

    const product = await Product.findById(productId);
    if (!product) throw new Error('Target catalog item could not be resolved.');
    if (product.stock < quantity) {
        throw new Error(`Insufficient inventory options. Available stock balance: ${product.stock}`);
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('Customer profile link broken or invalid.');

    const existingCartIndex = user.cart.findIndex(item => item.productId.toString() === productId);

    if (existingCartIndex > -1) {
        user.cart[existingCartIndex].quantity += quantity;
    } else {
        user.cart.push({ productId, quantity });
    }

    await user.save();
    return user.cart;
}

/**
 * Removes or decrements product entities mapped inside the client's current cart matrix array.
 */
async function removeFromCart(userId, { productId, removeAll = false }) {
    if (!productId) throw new Error('Target removal context requires a definitive productId.');

    const user = await User.findById(userId);
    if (!user) throw new Error('Customer profile link broken or invalid.');

    const targetIndex = user.cart.findIndex(item => item.productId.toString() === productId);
    if (targetIndex === -1) throw new Error('Item not found inside active cart selection.');

    if (removeAll || user.cart[targetIndex].quantity <= 1) {
        // Remove object node block completely
        user.cart.splice(targetIndex, 1);
    } else {
        // Decrement item trace count
        user.cart[targetIndex].quantity -= 1;
    }

    await user.save();
    return user.cart;
}

/**
 * Validates current stock balances, deducts counts, empties active carts, and registers order invoices.
 */
async function checkoutCart(userId, paymentPayload) {
    const { paymentGateway, mockCardNumber } = paymentPayload;
    if (!paymentGateway || !mockCardNumber) {
        throw new Error('Checkout operation aborted: Structural billing details missing.');
    }

    const user = await User.findById(userId).populate('cart.productId');
    if (!user || user.cart.length === 0) {
        throw new Error('Checkout operation aborted: Active shopping cart matrix is empty.');
    }

    const orderItems = [];
    let calculatedTotal = 0;

    // 1. Audit inventory locks upfront
    for (const cartItem of user.cart) {
        const product = cartItem.productId;
        if (!product) throw new Error('An item in your cart is no longer active in our system catalog.');
        if (product.stock < cartItem.quantity) {
            throw new Error(`Stock configuration mismatch for item "${product.name}". Required: ${cartItem.quantity}, Available: ${product.stock}.`);
        }

        orderItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity
        });
        calculatedTotal += product.price * cartItem.quantity;
    }

    // 2. Simulate Third-Party Payment Processor Verification
    if (mockCardNumber.startsWith('4000')) {
        throw new Error('Payment processing gateway event failure: Insufficient funds or invalid authorization token.');
    }
    const simulatedTransactionId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // 3. Perform atomic stock deductions via MongoDB operators
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } }
        );
    }

    // 4. Register complete order log along with payment success footprint metadata
    const invoice = await Order.create({
        userId: user._id,
        items: orderItems,
        totalAmount: calculatedTotal,
        status: 'Paid',
        paymentDetails: {
            transactionId: simulatedTransactionId,
            gateway: paymentGateway,
            paidAt: new Date()
        }
    });

    // 5. Clear active customer cart document layout
    user.cart = [];
    await user.save();

    return invoice;
}

export {
    getCatalog,
    appendToCart,
    removeFromCart,
    checkoutCart
};