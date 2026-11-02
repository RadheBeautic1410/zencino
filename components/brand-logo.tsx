import Image from "next/image";
import { LOGO_LIGHT_PATH, LOGO_PATH, PRODUCT_NAME } from "@/config/platform";

/**
 * Full wordmark. Size it with a height class; `onDark` swaps to the reversed
 * artwork, since the standard green lettering disappears on dark surfaces.
 */
export function BrandLogo({
  className,
  onDark = false,
  priority = false,
}: {
  className?: string;
  onDark?: boolean;
  priority?: boolean;
}) {
  return (
    <Image
      alt={PRODUCT_NAME}
      className={className}
      height={267}
      priority={priority}
      src={onDark ? LOGO_LIGHT_PATH : LOGO_PATH}
      style={{ width: "auto" }}
      width={1200}
    />
  );
}
