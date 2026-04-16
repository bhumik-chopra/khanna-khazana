export const ADMIN_CLERK_PUBLISHABLE_KEY =
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y2xhc3NpYy10b3J0b2lzZS00OC5jbGVyay5hY2NvdW50cy5kZXYk";

export const adminClerkEnabled = Boolean(ADMIN_CLERK_PUBLISHABLE_KEY);
