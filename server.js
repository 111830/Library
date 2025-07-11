const express = require('express');
const path = require('path');
const multer = require('multer');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
});

app.use(express.static(path.join(__dirname)));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const handleServerError = (res, error, message) => {
    console.error(message, error);
    return res.status(500).json({ message: message, error: error.message });
};

const buildFullImageUrl = (imagePath) => {
    const baseUrl = 'https://rydbyprilwqximbhivgp.supabase.co/storage/v1/object/public/book-covers/';
    if (imagePath && !imagePath.startsWith('http')) {
        return baseUrl + imagePath;
    }
    return imagePath;
};

// ... (endpoint-et e tjera si /api/login, /api/books, etj. mbeten siç ishin)
app.post('/api/login', (req, res) => {
    const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD;
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Ju lutem shkruani fjalëkalimin.' });
    if (password === MANAGER_PASSWORD) res.status(200).json({ success: true });
    else res.status(401).json({ success: false, message: 'Fjalëkalimi i pasaktë!' });
});

app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
        const booksWithFullUrls = result.rows.map(book => ({
            ...book,
            image: buildFullImageUrl(book.image)
        }));
        res.json(booksWithFullUrls);
    } catch (err) { handleServerError(res, err, 'Gabim gjatë marrjes së listës së librave.'); }
});

app.get('/api/book/search', async (req, res) => {
    const query = req.query.title;
    if (!query || query.length < 2) return res.json([]);
    try {
        const bookQuery = 'SELECT \'book\' as type, id, title as name, image FROM books WHERE title ILIKE $1 ORDER BY name ASC LIMIT 7';
        const authorQuery = 'SELECT \'author\' as type, NULL as id, author as name, NULL as image FROM books WHERE author ILIKE $1 GROUP BY author ORDER BY name ASC LIMIT 3';
        
        const [bookResults, authorResults] = await Promise.all([
            pool.query(bookQuery, [`%${query}%`]),
            pool.query(authorQuery, [`%${query}%`])
        ]);

        const booksWithFullUrls = bookResults.rows.map(book => ({
            ...book,
            image: buildFullImageUrl(book.image)
        }));
        
        const combinedResults = [...booksWithFullUrls, ...authorResults.rows];
        res.json(combinedResults);
    } catch (err) {
        handleServerError(res, err, 'Gabim në server gjatë kërkimit.');
    }
});

app.get('/api/book/:id', async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId)) return res.status(400).json({ message: 'ID e librit nuk është e vlefshme.' });
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Libri nuk u gjet.' });

        const book = result.rows[0];
        book.image = buildFullImageUrl(book.image);
        
        res.json(book);
    } catch (err) { handleServerError(res, err, 'Gabim gjatë marrjes së detajeve të librit.'); }
});


// NDRYSHIMI KRYESOR ËSHTË KËTU
app.post('/api/book', upload.single('image'), async (req, res) => {
    const { title, price, genre, author, longDescription, pershkrimi, botimi, page, year, offerPrice, languages, quantity, imageUrl } = req.body;
    let imagePath = null; // Fillon si null

    try {
        if (req.file) {
            const fileExt = path.extname(req.file.originalname);
            const fileName = `${Date.now()}${fileExt}`;

            // --- PJESA E ÇAKTIVIZUAR PËR TESTIM ---
            // const { error: uploadError } = await supabase.storage
            //     .from('book-covers')
            //     .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            // if (uploadError) throw uploadError;
            // --- FUNDI I PJESËS SË ÇAKTIVIZUAR ---
            
            console.log(`TESTIM: Ngarkimi në Supabase u anashkalua. Do të provohet të ruhet emri i skedarit: ${fileName}`);
            imagePath = fileName;

        } else if (imageUrl) {
            imagePath = imageUrl;
        }

        const languagesForDb = JSON.parse(languages || '[]');
        const query = `
            INSERT INTO books (title, price, image, genre, author, "longDescription", pershkrimi, botimi, page, year, "offerPrice", languages, quantity)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;`;
        const values = [
            title, parseFloat(price) || 0, imagePath, (genre || '').split(','), author, longDescription,
            pershkrimi, botimi, parseInt(page, 10) || null, parseInt(year, 10) || null,
            parseFloat(offerPrice) || null, JSON.stringify(languagesForDb), parseInt(quantity, 10) || 0
        ];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        handleServerError(res, err, 'Gabim gjatë shtimit të librit në databazë.');
    }
});

// NDRYSHIMI KRYESOR ËSHTË EDHE KËTU
app.put('/api/book/:id', upload.single('image'), async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const { title, price, genre, author, longDescription, pershkrimi, botimi, page, year, offerPrice, languages, quantity, imageUrl } = req.body;
    
    try {
        const { rows: existingRows } = await pool.query('SELECT image FROM books WHERE id = $1', [bookId]);
        if (existingRows.length === 0) return res.status(404).json({ message: 'Libri nuk u gjet.' });

        let imagePath = existingRows[0].image;

        if (req.file) {
            const fileExt = path.extname(req.file.originalname);
            const fileName = `${Date.now()}${fileExt}`;

            // --- PJESA E ÇAKTIVIZUAR PËR TESTIM ---
            // const { error: uploadError } = await supabase.storage
            //     .from('book-covers')
            //     .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            // if (uploadError) throw uploadError;
            // --- FUNDI I PJESËS SË ÇAKTIVIZUAR ---

            console.log(`TESTIM: Ngarkimi në Supabase u anashkalua. Do të provohet të ruhet emri i skedarit: ${fileName}`);
            imagePath = fileName;

        } else if (imageUrl) {
            imagePath = imageUrl;
        }
        
        const languagesForDb = JSON.parse(languages || '[]');
        const query = `
            UPDATE books SET title = $1, price = $2, image = $3, genre = $4, author = $5, "longDescription" = $6, 
            pershkrimi = $7, botimi = $8, page = $9, year = $10, "offerPrice" = $11, languages = $12, quantity = $13 
            WHERE id = $14 RETURNING *;`;
        const values = [
            title, parseFloat(price) || 0, imagePath, (genre || '').split(','), author, longDescription,
            pershkrimi, botimi, parseInt(page, 10) || null, parseInt(year, 10) || null,
            parseFloat(offerPrice) || null, JSON.stringify(languagesForDb), parseInt(quantity, 10) || 0, bookId
        ];
        const result = await pool.query(query, values);
        res.json({ message: 'Libri u përditësua me sukses!', book: result.rows[0] });
    } catch (err) {
        handleServerError(res, err, 'Gabim gjatë përditësimit të librit.');
    }
});


//... Kodi tjetër mbetet siç ishte
app.get('/api/featured-authors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM featured_authors ORDER BY id');
        const authorsWithFullUrls = result.rows.map(author => ({
            ...author,
            image_url: buildFullImageUrl(author.image_url)
        }));
        res.json(authorsWithFullUrls);
    } catch (err) {
        handleServerError(res, err, 'Gabim gjatë leximit të autorëve nga databaza.');
    }
});

app.put('/api/featured-authors/:id', upload.single('image'), async (req, res) => {
    const authorId = parseInt(req.params.id, 10);
    const { name, nationality, description } = req.body;

    try {
        const { rows: existingRows } = await pool.query('SELECT image_url FROM featured_authors WHERE id = $1', [authorId]);
        if (existingRows.length === 0) return res.status(404).json({ message: 'Autori nuk u gjet.' });
        
        let newImagePath = existingRows[0].image_url;

        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            newImagePath = fileName;
        }

        const query = `UPDATE featured_authors SET name = $1, nationality = $2, description = $3, image_url = $4 WHERE id = $5 RETURNING *;`;
        const values = [name, nationality, description, newImagePath, authorId];
        const result = await pool.query(query, values);
        
        const updatedAuthor = result.rows[0];
        if (updatedAuthor) {
            updatedAuthor.image_url = buildFullImageUrl(updatedAuthor.image_url);
        }

        res.json({ message: 'Autori u përditësua me sukses!', author: updatedAuthor });
    } catch (err) {
        handleServerError(res, err, 'Gabim gjatë përditësimit të autorit.');
    }
});

app.post('/api/order/checkout', async (req, res) => {
    const { basket, userInfo } = req.body;
    if (!basket || !Array.isArray(basket) || basket.length === 0) return res.status(400).json({ message: "Shporta është bosh ose e pavlefshme." });
    if (!userInfo) return res.status(400).json({ message: "Të dhënat e përdoruesit mungojnë." });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updatePromises = basket.map(item => {
            if (!item.productId || !item.quantity) throw new Error('Artikull i pavlefshëm në shportë.');
            return client.query('UPDATE books SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1', [item.quantity, item.productId]);
        });
        const results = await Promise.all(updatePromises);
        results.forEach((result, index) => {
            if (result.rowCount === 0) throw new Error(`Sasia nuk është e mjaftueshme për librin: ${basket[index].name}`);
        });

        const yourPhoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
        const yourApiKey = process.env.WHATSAPP_API_KEY;
        let summaryText = basket.map(item => `- ${item.name} (Sasia: ${item.quantity})`).join('\n');
        
        const totalCost = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = userInfo.state === 'Shqipëri' ? 200 : userInfo.state === 'Kosovë' ? 500 : 0;
        const finalTotal = totalCost + shippingCost;
        const message = `*POROSI E RE NGA FAQJA!* 📢\n\n` +
                        `*Klienti:* ${userInfo.firstName} ${userInfo.lastName}\n` +
                        `*Tel:* ${userInfo.phone}\n` +
                        `*Adresa:* ${userInfo.address}, ${userInfo.city}, ${userInfo.state}\n` +
                        `-------------------------------------\n` +
                        `*Artikujt e Porositur:*\n${summaryText}\n` +
                        `-------------------------------------\n` +
                        `*Totali i librave:* ${totalCost} LEK\n` +
                        `*Posta:* ${shippingCost} LEK\n` +
                        `*TOTALI FINAL: ${finalTotal} LEK*`;
        const encodedMessage = encodeURIComponent(message);
        const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${yourPhoneNumber}&text=${encodedMessage}&apikey=${yourApiKey}`;
        fetch(apiUrl).catch(err => console.error("Gabim gjate dergimit te mesazhit ne WhatsApp (nuk ndikon porosine):", err));
        
        await client.query('COMMIT');
        res.status(200).json({ success: true, message: "Porosia u regjistrua dhe njoftimi u dërgua me sukses." });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Gabim gjatë finalizimit të porosisë:', error);
        res.status(500).json({ message: `Gabim gjatë përditësimit të sasisë: ${error.message}` });
    } finally {
        client.release();
    }
});


app.listen(port, () => {
    console.log(`Serveri po funksionon në portin ${port}`);
});