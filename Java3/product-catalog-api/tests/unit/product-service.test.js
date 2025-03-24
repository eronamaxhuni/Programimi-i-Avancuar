const productService = require('../../src/services/product-service');
const products = require('../../src/data/products');

describe('ProductService', () => {
  // Sample test to get started
  describe('getAllProducts', () => {
    it('should return all products when no filters are applied', () => {
      const result = productService.getAllProducts();
      expect(result.products.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('offset');
    });

    it('should return filtered products based on category', () => {
      const result = productService.getAllProducts({ category: 'Electronics' });
      expect(result.products.length).toBeGreaterThan(0);
      result.products.forEach(product => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should return products filtered by minPrice', () => {
      const result = productService.getAllProducts({ minPrice: 50 });
      result.products.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(50);
      });
    });

    it('should return products filtered by maxPrice', () => {
      const result = productService.getAllProducts({ maxPrice: 100 });
      result.products.forEach(product => {
        expect(product.price).toBeLessThanOrEqual(100);
      });
    });

    it('should return products that are in stock when filtered by inStock', () => {
      const result = productService.getAllProducts({ inStock: 'true' });
      result.products.forEach(product => {
        expect(product.inStock).toBe(true);
      });
    });

    it('should support pagination with limit and offset', () => {
      const result = productService.getAllProducts({ limit: 5, offset: 5 });
      expect(result.products.length).toBe(5);
      expect(result.offset).toBe(5);
      expect(result.total).toBeGreaterThan(5);
    });
  });

  // Test for getting product by ID
  describe('getProductById', () => {
    it('should return a product when a valid ID is provided', () => {
      const product = productService.getProductById('1');
      expect(product).toHaveProperty('id');
      expect(product.id).toBe('1');
    });
  });

  // Test for getting all categories
  describe('getAllCategories', () => {
    it('should return a list of unique categories', () => {
      const categories = productService.getAllCategories();
      expect(categories).toHaveProperty('categories');
      expect(Array.isArray(categories.categories)).toBe(true);
      expect(categories.categories.length).toBeGreaterThan(0);
    });
  });
});
