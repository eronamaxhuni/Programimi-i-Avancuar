const request = require('supertest');
const app = require('../../src/app');

describe('Product API Routes', () => {
  // Valid API key for tests
  const validApiKey = 'test-api-key';
  
  // Sample test to get started
  describe('GET /api/products', () => {
    it('should return 401 if no API key is provided', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toEqual(401);
    });
    
    it('should return a list of products with valid API key', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('X-API-Key', validApiKey);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('products');
      expect(Array.isArray(res.body.products)).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 404 if product not found', async () => {
      const res = await request(app)
        .get('/api/products/999')
        .set('X-API-Key', validApiKey);
        
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Product not found');
    });

    it('should return a product by ID', async () => {
      const res = await request(app)
        .get('/api/products/1')
        .set('X-API-Key', validApiKey);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBe('1');
    });
  });
  
  describe('POST /api/products', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('X-API-Key', validApiKey)
        .send({ price: 100, category: 'Electronics' });
        
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Product must have name, price, and category');
    });

    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        price: 200,
        category: 'Home Appliances',
      };
      
      const res = await request(app)
        .post('/api/products')
        .set('X-API-Key', validApiKey)
        .send(newProduct);
        
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Product');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should return 404 if product not found for update', async () => {
      const res = await request(app)
        .put('/api/products/999')
        .set('X-API-Key', validApiKey)
        .send({ price: 250 });
        
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Product not found');
    });

    it('should update a product', async () => {
      const updates = { price: 300 };
      
      const res = await request(app)
        .put('/api/products/1')
        .set('X-API-Key', validApiKey)
        .send(updates);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.price).toBe(300);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should return 404 if product not found for deletion', async () => {
      const res = await request(app)
        .delete('/api/products/999')
        .set('X-API-Key', validApiKey);
        
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Product not found');
    });

    it('should delete a product', async () => {
      const res = await request(app)
        .delete('/api/products/1')
        .set('X-API-Key', validApiKey);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Product deleted successfully');
    });
  });
});
