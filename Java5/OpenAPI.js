// Import necessary modules
import express from 'express'; // Using ES Module syntax (see package.json note)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// --- Supabase Configuration ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key must be set in .env file");
}

const supabase = createClient(supabaseUrl, supabaseKey);
// ----------------------------

// --- Express App Setup ---
const app = express();
const port = process.env.PORT || 8000; // Use environment port or default to 8000

// Middleware to parse JSON request bodies
app.use(express.json());
// -------------------------

// --- API Endpoints ---

// GET /products - Retrieve all products
app.get('/products', async (req, res) => {
    console.log('GET /products'); // Add logging
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            console.error('Supabase error:', error);
            // Consider more specific error codes based on Supabase error
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'An unexpected server error occurred' });
    }
});

// GET /products/:id - Retrieve a single product by ID
app.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`GET /products/${id}`); // Add logging
    try {
        // .single() expects exactly one row or null
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single(); // Use .single() to get one record or null

        if (error && error.code !== 'PGRST116') { // PGRST116: Row not found by single()
             console.error('Supabase error:', error);
             return res.status(500).json({ error: error.message });
        }
        if (!data) {
            return res.status(404).json({ error: `Product with id ${id} not found` });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'An unexpected server error occurred' });
    }
});

// POST /products - Create a new product
app.post('/products', async (req, res) => {
    const { name, description, price } = req.body;
    console.log('POST /products', req.body); // Add logging

    // Basic validation (consider using a library like Zod for more complex validation)
    if (typeof name !== 'string' || typeof price !== 'number') {
         return res.status(400).json({ error: 'Invalid input: name (string) and price (number) are required.' });
    }

    try {
        // .select().single() returns the newly created row
        const { data, error } = await supabase
            .from('products')
            .insert({ name, description, price })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }
        if (!data) {
             return res.status(500).json({ error: 'Failed to create product, no data returned.' });
        }

        res.status(201).json(data); // 201 Created status
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'An unexpected server error occurred' });
    }
});

// PUT /products/:id - Update an existing product
app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;
    console.log(`PUT /products/${id}`, req.body); // Add logging

    // Basic validation (ensure at least one field is provided for update)
     if (name === undefined && description === undefined && price === undefined) {
         return res.status(400).json({ error: 'No fields provided for update.' });
     }
     // Type validation if fields are present
     if ((name !== undefined && typeof name !== 'string') ||
         (price !== undefined && typeof price !== 'number') ||
         (description !== undefined && typeof description !== 'string' && description !== null)) {
         return res.status(400).json({ error: 'Invalid data types for update fields.' });
     }

    // Construct update object only with provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description; // Allow null description
    if (price !== undefined) updateData.price = price;


    try {
        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 occurs if .single() finds no matching row after update attempt
             console.error('Supabase error:', error);
             return res.status(500).json({ error: error.message });
        }
        // If error is PGRST116 or data is null, the row wasn't found
        if (!data) {
            return res.status(404).json({ error: `Product with id ${id} not found or update failed` });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'An unexpected server error occurred' });
    }
});

// DELETE /products/:id - Delete a product
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
     console.log(`DELETE /products/${id}`); // Add logging

    try {
        const { error, count } = await supabase // Check count if available
            .from('products')
            .delete({ count: 'exact' }) // Request count of deleted rows
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        // Check if any row was actually deleted
        if (count === 0) {
             return res.status(404).json({ error: `Product with id ${id} not found` });
        }

        res.status(204).send(); // 204 No Content status
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'An unexpected server error occurred' });
    }
});
// -------------------------

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
// --------------------