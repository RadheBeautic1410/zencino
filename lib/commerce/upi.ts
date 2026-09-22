import QRCode from "qrcode";

export interface GenerateUpiParams {
  amountRupees: number;
  note?: string;
  orderNumber: string;
  upiId: string;
  upiName: string;
}

/**
 * Builds standard NPCI-compliant UPI URI for dynamic QR codes and mobile app intents.
 * Spec: upi://pay?pa={upiId}&pn={name}&am={amount}&cu=INR&tn={note}
 */
export function generateUpiUri(params: GenerateUpiParams): string {
  const { upiId, upiName, amountRupees, orderNumber, note } = params;
  const cleanUpiId = upiId.trim();
  const cleanName = upiName.trim();
  const formattedAmount = amountRupees.toFixed(2);
  const transactionNote = (note || `Zencino Order ${orderNumber}`).trim();

  const query = new URLSearchParams();
  query.set("pa", cleanUpiId);
  query.set("pn", cleanName);
  query.set("am", formattedAmount);
  query.set("cu", "INR");
  query.set("tn", transactionNote);

  return `upi://pay?${query.toString()}`;
}

/**
 * Generates an SVG string representation of the QR code for crisp vector rendering.
 */
export async function generateQrCodeSvg(upiUri: string): Promise<string> {
  return QRCode.toString(upiUri, {
    type: "svg",
    margin: 1,
    width: 280,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Generates a base64 PNG data URL for quick embedding in <img> tags.
 */
export async function generateQrCodeDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    margin: 1,
    width: 280,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Validates Indian UPI reference numbers (UTR).
 * UPI transaction references are typically 12 numeric digits (e.g. 425612345678).
 * Some bank IMPS/NEFT transfers may have 12-16 alphanumeric characters.
 */
export function isValidUtr(utr: string): boolean {
  const clean = utr.trim().replace(/\s+/g, "");
  return /^[A-Za-z0-9]{8,24}$/.test(clean);
}
