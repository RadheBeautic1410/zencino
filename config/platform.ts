export const PRODUCT_NAME = "Zencino";
export const PRODUCT_DESCRIPTION =
  "Shop Zencino home, kitchen, and everyday essentials.";
export const LOGO_PATH = "/brand-mark.svg";

export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

export const SELLER_INFO = {
  legalName: "Zencino Retail Solutions Pvt. Ltd.",
  tradeName: "Zencino",
  addressLine1: "Unit 402, Spectrum Tower, Mindspace",
  addressLine2: "Malad West",
  city: "Mumbai",
  state: "Maharashtra",
  stateCode: "27",
  pincode: "400064",
  country: "India",
  gstin: "27AAACZ1234A1Z5",
  pan: "AAACZ1234A",
  cin: "U52100MH2025PTC123456",
  supportEmail: "support@zencino.com",
  supportPhone: "+91 98765 43210",
  defaultHsn: "39269099", // Optical acrylic organizers & household storage
};

/**
 * Storefront social profiles. Handles are placeholders until the accounts are
 * claimed — the footer renders only the entries listed here, so drop any row
 * that will not exist at launch.
 */
export const SOCIAL_LINKS = [
  { href: "https://instagram.com/zencino", label: "Instagram" },
  { href: "https://facebook.com/zencino", label: "Facebook" },
  { href: "https://youtube.com/@zencino", label: "YouTube" },
  { href: "https://x.com/zencino", label: "X" },
  { href: "https://pinterest.com/zencino", label: "Pinterest" },
] as const;
