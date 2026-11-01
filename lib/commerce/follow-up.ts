// Helpers for following up on orders a customer placed but has not paid for.
// The customer gave this contact for the order, so reminders stay about it.

/** Indian mobile number in wa.me form (91XXXXXXXXXX), or null if unusable. */
export function toWhatsAppNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return /^91[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function buildPaymentReminderText(order: {
  customerName: string;
  orderNumber: string;
  totalMinor: number;
  itemNames: string[];
}): string {
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const items =
    order.itemNames.length > 1
      ? `${order.itemNames[0]} + ${order.itemNames.length - 1} more`
      : (order.itemNames[0] ?? "your items");
  const total = (order.totalMinor / 100).toLocaleString("en-IN");
  return `Hi ${firstName}, this is Zencino. Your order ${order.orderNumber} for ${items} (₹${total}) is waiting for payment. Need any help completing it? Just reply here and we'll assist.`;
}

export function buildWhatsAppUrl(phone: string, text: string): string | null {
  const number = toWhatsAppNumber(phone);
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : null;
}
