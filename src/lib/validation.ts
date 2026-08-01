import { z } from "zod";

// ============================================
// SECURITY VALIDATION SCHEMAS
// Comprehensive input validation to prevent SQL injection and XSS attacks
// ============================================

// Common dangerous patterns to block
const SQL_INJECTION_PATTERNS = /('|--|;|\/\*|\*\/|xp_|exec\s|execute\s|select\s|insert\s|update\s|delete\s|drop\s|union\s|or\s+1\s*=\s*1|and\s+1\s*=\s*1)/gi;
const XSS_PATTERNS = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed|<svg.*on|data:text\/html/gi;

// Sanitization function to clean user input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/['"]/g, (match) => (match === "'" ? "\u2019" : "\u201D")) // Replace quotes with safe versions
    .slice(0, 10000); // Limit length
};

// Check for dangerous patterns
const hasDangerousPatterns = (value: string): boolean => {
  return SQL_INJECTION_PATTERNS.test(value) || XSS_PATTERNS.test(value);
};

// Security refine check as a standalone function
const securityCheck = (val: string) => !hasDangerousPatterns(val);
const securityCheckMessage = "Input contains invalid characters";

// ============================================
// COMMON FIELD VALIDATORS
// ============================================

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email must be less than 255 characters")
  .email("Please enter a valid email address")
  .transform((val) => val.toLowerCase());

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be less than 128 characters");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s\-'.]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .refine(securityCheck, { message: securityCheckMessage });

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number must be at least 7 digits")
  .max(20, "Phone number must be less than 20 characters")
  .regex(/^[\+]?[\d\s\-\(\)]+$/, "Please enter a valid phone number");

export const urlSchema = z
  .string()
  .trim()
  .max(500, "URL must be less than 500 characters")
  .refine(
    (val) => val === "" || (val.startsWith("http://") || val.startsWith("https://")),
    { message: "URL must start with http:// or https://" }
  )
  .refine(
    (val) => {
      if (val === "") return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL" }
  )
  .optional()
  .or(z.literal(""));

export const textAreaSchema = (maxLength: number = 2000) =>
  z
    .string()
    .trim()
    .min(1, "This field is required")
    .max(maxLength, `Must be less than ${maxLength} characters`)
    .refine(securityCheck, { message: securityCheckMessage });

export const optionalTextAreaSchema = (maxLength: number = 2000) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be less than ${maxLength} characters`)
    .refine(securityCheck, { message: securityCheckMessage })
    .optional()
    .or(z.literal(""));

export const addressSchema = z
  .string()
  .trim()
  .min(5, "Please enter a valid address")
  .max(500, "Address must be less than 500 characters")
  .refine(securityCheck, { message: securityCheckMessage });

export const citySchema = z
  .string()
  .trim()
  .min(2, "City must be at least 2 characters")
  .max(100, "City must be less than 100 characters")
  .regex(/^[a-zA-Z\s\-'.]+$/, "City can only contain letters, spaces, and hyphens")
  .refine(securityCheck, { message: securityCheckMessage });

export const zipCodeSchema = z
  .string()
  .trim()
  .max(20, "ZIP code must be less than 20 characters")
  .regex(/^[a-zA-Z0-9\s\-]*$/, "Please enter a valid ZIP code")
  .optional()
  .or(z.literal(""));

export const countrySchema = z
  .string()
  .trim()
  .min(2, "Country must be at least 2 characters")
  .max(100, "Country must be less than 100 characters")
  .regex(/^[a-zA-Z\s\-]+$/, "Country can only contain letters, spaces, and hyphens")
  .refine(securityCheck, { message: securityCheckMessage });

export const subjectSchema = z
  .string()
  .trim()
  .min(3, "Subject must be at least 3 characters")
  .max(200, "Subject must be less than 200 characters")
  .refine(securityCheck, { message: securityCheckMessage });

// ============================================
// FORM SCHEMAS
// ============================================

// Newsletter subscription
export const newsletterSchema = z.object({
  email: emailSchema,
});

// Contact form
export const contactFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  subject: subjectSchema,
  message: textAreaSchema(2000),
});

// Internship application
export const internshipApplicationSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  program: z.string().min(1, "Please select a program"),
  education: z.enum(["high-school", "diploma", "bachelors", "masters", "phd"], {
    errorMap: () => ({ message: "Please select your education level" }),
  }),
  preferredType: z.enum(["paid", "unpaid", "stipend"], {
    errorMap: () => ({ message: "Please select your preferred type" }),
  }),
  stipendAmount: z.string().optional(),
  experience: optionalTextAreaSchema(2000),
  motivation: textAreaSchema(2000),
  availability: z.enum(["immediately", "2-weeks", "1-month", "2-months"], {
    errorMap: () => ({ message: "Please select your availability" }),
  }),
  linkedIn: urlSchema,
});

// Checkout shipping information
export const shippingInfoSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  city: citySchema,
  state: citySchema,
  zipCode: zipCodeSchema,
  country: countrySchema,
});

// Service booking request
export const serviceBookingSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  serviceType: z.string().min(1, "Please select a service type"),
  brief: textAreaSchema(3000),
});

// Auth login
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Auth signup
export const signupSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ============================================
// VALIDATION HELPERS
// ============================================

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
};

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: "Validation failed" } };
  }
}

// Safe error message display (prevents leaking internal details)
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error details to users
    const message = error.message.toLowerCase();
    if (message.includes("unique") || message.includes("duplicate")) {
      return "This entry already exists";
    }
    if (message.includes("foreign key") || message.includes("reference")) {
      return "Invalid reference provided";
    }
    if (message.includes("permission") || message.includes("policy")) {
      return "You don't have permission to perform this action";
    }
    // For other errors, return generic message
    return "An error occurred. Please try again.";
  }
  return "An unexpected error occurred";
}
