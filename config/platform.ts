export const PRODUCT_NAME = "Zencino";
export const PRODUCT_DESCRIPTION =
  "Zencino is an Indian brand of home, kitchen and everyday essentials. Shop the official Zencino store at zencino.com.";
export const LOGO_PATH = "/logo.png";
export const LOGO_LIGHT_PATH = "/logo-light.png";
export const BRAND_MARK_PATH = "/brand-mark.png";

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

/** Customer chat line; the storefront's floating button opens wa.me with it. */
export const WHATSAPP_NUMBER = "919499673369";

// Only accounts Zencino actually owns: these also feed the Organization
// `sameAs` in app/layout.tsx, which tells Google the profiles and this domain
// are one brand. Add a row only once the account is live.
export const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/zencino.shop/", label: "Instagram" },
] as const;
