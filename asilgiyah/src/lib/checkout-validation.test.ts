import { describe, expect, it } from "vitest";
import { checkoutSchema, latinDigits } from "./checkout-validation";

const valid = {
  name: "آزمایش مشتری",
  phone: "09123456789",
  email: "test@example.com",
  province: "تهران",
  city: "تهران",
  postalCode: "1234567890",
  address: "خیابان نمونه، کوچه آزمایش، پلاک ۱۲",
};

describe("checkout validation", () => {
  it("normalizes Persian and Arabic digits", () => {
    expect(latinDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(latinDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("accepts a valid Iranian mobile number and ten-digit postal code", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("normalizes a +98 phone number and Persian postal digits", () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      phone: "+98 912 345 6789",
      postalCode: "۱۲۳۴۵۶۷۸۹۰",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("09123456789");
      expect(result.data.postalCode).toBe("1234567890");
    }
  });

  it("rejects invalid phone, postal code, and short address", () => {
    expect(checkoutSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, postalCode: "1234" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, address: "تهران" }).success).toBe(false);
  });
});
