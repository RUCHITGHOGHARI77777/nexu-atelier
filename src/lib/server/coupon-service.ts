import { adminService } from "./admin-service";

export interface CouponValidationResult {
  valid: boolean;
  discountPaise: number;
  message?: string;
  error?: string;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    description?: string | null;
  };
}

export class CouponService {
  async validateCoupon(
    code: string,
    userId: string | undefined,
    subtotalPaise: number
  ): Promise<CouponValidationResult> {
    const res = await adminService.validateAndApplyCoupon(code, subtotalPaise, userId);
    const msg = res.error || (res.valid ? "Coupon applied successfully" : undefined);
    return {
      valid: res.valid,
      discountPaise: res.discountPaise,
      message: msg ? (msg.toLowerCase().includes("minimum order") ? `Minimum order amount not met: ${msg}` : msg) : undefined,
      error: res.error,
      coupon: res.coupon,
    };
  }
}

export const couponService = new CouponService();
