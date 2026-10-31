// Maharashtra State Code = 27
const HOME_STATE_CODE = process.env.COMPANY_STATE_CODE || "27";

export const calculateOrderFinancials = ({
  items,
  couponDiscount = 0,
  stateCode,
  paymentMethod,
}) => {
  // 1. Calculate raw subtotal from DB items
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // 2. Apply Coupon
  const discountedSubtotal = Math.max(0, itemsSubtotal - couponDiscount);

  // 3. Optional Prepaid Discount (Bonus: 5% off for paying online to reduce COD RTO)
  let prepaidDiscount = 0;
  if (paymentMethod === "Prepaid") {
    prepaidDiscount = Math.round(discountedSubtotal * 0.05); // 5% prepaid incentive
  }

  const netPayable = Math.max(0, discountedSubtotal - prepaidDiscount);

  // 4. GST Breakdown (Standard 18% GST for health supplements)
  // Inclusive Formula: Taxable = Net / 1.18, Tax = Net - Taxable
  const gstRate = 0.18;
  const taxableAmount = Math.round((netPayable / (1 + gstRate)) * 100) / 100;
  const totalTax = Math.round((netPayable - taxableAmount) * 100) / 100;

  const isInterState =
    String(stateCode).trim() !== String(HOME_STATE_CODE).trim();

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    // Other states: 18% IGST
    igst = totalTax;
  } else {
    // Within Maharashtra: 9% CGST + 9% SGST
    cgst = Math.round((totalTax / 2) * 100) / 100;
    sgst = Math.round((totalTax - cgst) * 100) / 100;
  }

  return {
    itemsSubtotal,
    couponDiscount,
    prepaidDiscount,
    taxableAmount,
    isInterState,
    cgst,
    sgst,
    igst,
    totalTax,
    shippingFee: 0, // Free shipping for Alpha Male platform
    totalAmount: netPayable,
  };
};

// Convert number to Indian currency words for GST Invoice
export const amountInWords = (num) => {
  if (!num || num === 0) return "Zero Rupees Only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertLessThanOneThousand = (n) => {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  };

  let n = Math.floor(num);
  let words = "";

  if (Math.floor(n / 10000000) > 0) {
    words += convertLessThanOneThousand(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    words += convertLessThanOneThousand(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    words += convertLessThanOneThousand(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    words += convertLessThanOneThousand(n);
  }

  return `${words.trim()} Rupees Only`;
};
