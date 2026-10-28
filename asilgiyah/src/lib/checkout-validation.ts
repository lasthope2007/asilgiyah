import { z } from "zod";

export const latinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .transform(latinDigits)
    .transform((value) =>
      value.replace(/[\s-]/g, "").replace(/^(?:\+98|0098)/, "0"),
    )
    .pipe(z.string().regex(/^09\d{9}$/)),
  email: z.string().trim().email().max(254),
  province: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  postalCode: z
    .string()
    .trim()
    .transform(latinDigits)
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{10}$/)),
  address: z.string().trim().min(10).max(500),
});
