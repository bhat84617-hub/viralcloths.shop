const generateSKU = (categorySlug, productId, variant = {}) => {
  const prefix = (categorySlug || 'GEN').substring(0, 4).toUpperCase();
  const id = productId.toString().padStart(4, '0');
  const color = variant.color ? variant.color.substring(0, 2).toUpperCase() : 'XX';
  const size = variant.size ? variant.size.toUpperCase() : 'XX';
  return `${prefix}-${id}-${color}${size}`;
};

module.exports = { generateSKU };
