const { ObjectId } = require('mongodb');
const slugify = require('slugify');

// Convert string to ObjectId
const toObjectId = (id) => {
  if (!id) return null;
  if (ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return null;
};

// Generate slug from text
const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

// Pagination helper
const paginate = (page = '1', perPage = '10') => {
  const pageNum = parseInt(page, 10) || 1;
  const perPageNum = parseInt(perPage, 10) || 10;
  const skip = (pageNum - 1) * perPageNum;
  const limit = perPageNum;
  
  return { skip, limit, page: pageNum, perPage: perPageNum };
};

// Build pagination meta
const buildPaginationMeta = (total, page, perPage) => {
  const lastPage = Math.ceil(total / perPage);
  return {
    current_page: page,
    per_page: perPage,
    total,
    last_page: lastPage,
    has_more_pages: page < lastPage
  };
};

// Format price (remove currency symbols, convert to number)
const formatPrice = (price) => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    return parseFloat(price.replace(/[^\d.]/g, '')) || 0;
  }
  return 0;
};

// Calculate discount percentage
const calculateDiscount = (mainPrice, strokedPrice) => {
  if (!strokedPrice || strokedPrice <= 0 || mainPrice >= strokedPrice) {
    return 0;
  }
  return Math.round(((strokedPrice - mainPrice) / strokedPrice) * 100);
};

// Generate order code
const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Calculate price from base price and discount
const calculatePriceFromDiscount = (basePrice, discountType, discountValue) => {
  if (!basePrice || basePrice <= 0) return { mainPrice: 0, strokedPrice: null, discount: 0 };
  
  if (!discountType || !discountValue || discountValue <= 0) {
    // No discount - base price is the main price
    return {
      mainPrice: basePrice,
      strokedPrice: null,
      discount: 0
    };
  }
  
  let discountedPrice = basePrice;
  
  if (discountType === 'percentage') {
    // Percentage discount
    const discountPercent = Math.min(Math.max(parseFloat(discountValue), 0), 100);
    discountedPrice = basePrice * (1 - discountPercent / 100);
  } else if (discountType === 'flat') {
    // Flat discount
    discountedPrice = Math.max(0, basePrice - parseFloat(discountValue));
  }
  
  const discountPercent = calculateDiscount(discountedPrice, basePrice);
  
  return {
    mainPrice: Math.round(discountedPrice),
    strokedPrice: basePrice,
    discount: discountPercent
  };
};

// Format product for API response
const formatProduct = (product, includeDetails = false) => {
  // Calculate prices from base_price and discount
  const basePrice = product.base_price || product.main_price || 0;
  const discountType = product.discount_type || null;
  const discountValue = product.discount_value || null;
  
  // Use new pricing system if base_price exists, otherwise fallback to old system
  let priceData;
  if (product.base_price !== undefined) {
    priceData = calculatePriceFromDiscount(basePrice, discountType, discountValue);
  } else {
    // Legacy support for old products
    priceData = {
      mainPrice: product.main_price || 0,
      strokedPrice: product.stroked_price || null,
      discount: calculateDiscount(product.main_price, product.stroked_price)
    };
  }
  
  const formatted = {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    main_price: priceData.mainPrice,
    stroked_price: priceData.strokedPrice,
    discount: priceData.discount,
    rating: product.rating || 0,
    rating_count: product.rating_count || product.sales || 0, // rating_count for frontend compatibility
    sales: product.sales || 0,
    thumbnail_image: product.thumbnail_image || null,
    current_stock: product.current_stock || 0,
    featured: product.featured || false,
    published: product.published || false,
    warranty_period: product.warranty_period || null // Warranty period in months
  };

  if (includeDetails) {
    formatted.description = product.description || '';
    formatted.images = product.images || [];
    formatted.photos = product.photos || [];
    formatted.category_id = product.category_id?.toString() || null;
    formatted.brand_id = product.brand_id?.toString() || null;
    formatted.specifications = product.specifications || [];
    formatted.featured_specs = product.featured_specs || [];
    formatted.basic_specs = product.basic_specs || null;
    formatted.colors = product.colors || [];
    formatted.choice_options = product.choice_options || [];
    formatted.variants = product.variants || [];
    formatted.product_compatible = product.product_compatible || [];
    formatted.viewing_count = product.viewing_count || 0;
    formatted.units_sold = product.units_sold || 0;
    formatted.meta_title = product.meta_title || '';
    formatted.meta_description = product.meta_description || '';
  }

  return formatted;
};

// Format category for API response
const formatCategory = (category) => {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    icon: category.icon || null,
    banner: category.banner || null,
    cover_image: category.cover_image || category.banner || null,
    featured: category.featured || false,
    parent_id: category.parent_id?.toString() || null,
    order: category.order || 0
  };
};

// Format order for API response
const formatOrder = (order) => {
  return {
    id: order._id.toString(),
    order_code: order.order_code,
    customer: order.customer,
    items: order.items,
    total_amount: order.total_amount,
    shipping_cost: order.shipping_cost || 0,
    discount_amount: order.discount_amount || 0,
    final_amount: order.final_amount || 0,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    delivery_status: order.delivery_status,
    created_at: order.created_at
  };
};

// Sanitize user data (remove password)
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...userData } = user;
  return {
    ...userData,
    id: user._id.toString()
  };
};

module.exports = {
  toObjectId,
  generateSlug,
  paginate,
  buildPaginationMeta,
  formatPrice,
  calculateDiscount,
  calculatePriceFromDiscount,
  generateOrderCode,
  formatProduct,
  formatCategory,
  formatOrder,
  sanitizeUser
};

