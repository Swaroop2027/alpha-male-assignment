import Product from "../models/Product.js";
import { ApiError } from "./apiResponse.js";

export const reduceOrderStockAtomically = async (items) => {
  const decrementedItems = [];

  try {
    for (const item of items) {
      // Atomic find and update: only decrements IF stock is greater than or equal to requested quantity
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );

      if (!updatedProduct) {
        // Concurrency catch: Item just got sold out by another concurrent request!
        throw new Error(
          `Insufficient stock for product: "${item.title}". It just sold out!`,
        );
      }

      decrementedItems.push({
        productId: item.product,
        quantity: item.quantity,
      });
    }

    return true;
  } catch (error) {
    // Rollback any successfully decremented items in this transaction
    for (const rollbackItem of decrementedItems) {
      await Product.findByIdAndUpdate(rollbackItem.productId, {
        $inc: { stock: rollbackItem.quantity },
      });
    }
    throw new ApiError(error.message, 409); // 409 Conflict
  }
};
