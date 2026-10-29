// The backend stores phones as +91XXXXXXXXXX. Forms here take the 10-digit
// local number, so strip the country code before pre-filling them.
export const toLocalMobile = (phone) => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};
