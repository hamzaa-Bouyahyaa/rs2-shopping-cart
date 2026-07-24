// Client-side product name rule from the brief: characters [A-Za-z], max
// length 30. The server applies the same rule; this copy exists purely for
// immediate visual feedback while typing.

export const PRODUCT_NAME_MAX_LENGTH = 30;

const PRODUCT_NAME_PATTERN = /^[A-Za-z]+$/;

export function validateProductName(name) {
  if (!name) {
    return 'Product name is required.';
  }
  if (name.length > PRODUCT_NAME_MAX_LENGTH) {
    return `Product name cannot exceed ${PRODUCT_NAME_MAX_LENGTH} characters.`;
  }
  if (!PRODUCT_NAME_PATTERN.test(name)) {
    return 'Product name may only contain letters (A-Z or a-z).';
  }
  return null;
}
