const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const port = 3000;


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'libraria_db',
    password: 'Renis1234$',
    port: 5432,
});

app.use(express.static(path.join(__dirname)));
app.use('/Image', express.static(path.join(__dirname, 'Image')));
app.use(express.json());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'Image/';
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const handleServerError = (res, error, message) => {
    console.error(message, error);
    return res.status(500).json({ message: message, error: error.message });
};

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
        res.json(result.rows);
    } catch (err) { handleServerError(res, err, 'Gabim gjatë marrjes së listës së librave.'); }
});

app.get('/api/book/search', async (req, res) => {
    const query = req.query.title;
    if (!query || query.length < 2) {
        return res.json([]);
    }
    try {
        const bookQuery = 'SELECT \'book\' as type, id, title as name, image FROM books WHERE title ILIKE $1 ORDER BY name ASC LIMIT 7';
        const authorQuery = 'SELECT \'author\' as type, NULL as id, author as name, NULL as image FROM books WHERE author ILIKE $1 GROUP BY author ORDER BY name ASC LIMIT 3';
        const bookPromise = pool.query(bookQuery, [`%${query}%`]);
        const authorPromise = pool.query(authorQuery, [`%${query}%`]);
        const [bookResults, authorResults] = await Promise.all([bookPromise, authorPromise]);
        const combinedResults = [...bookResults.rows, ...authorResults.rows];
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
        res.json(result.rows[0]);
    } catch (err) { handleServerError(res, err, 'Gabim gjatë marrjes së detajeve të librit.'); }
});

app.post('/api/book', upload.single('image'), async (req, res) => {
    const { title, price, genre, author, longDescription, pershkrimi, botimi, page, year, offerPrice, languages, quantity, imageUrl } = req.body;
    let imagePath = '';
    if (req.file) {
        imagePath = req.file.path.replace(/\\/g, "/");
    } else if (imageUrl) {
        imagePath = imageUrl;
    } else {
        return res.status(400).json({ message: 'Ju lutem ngarkoni një foto ose vendosni një link imazhi.' });
    }
    const languagesForDb = JSON.parse(languages || '[]');
    const query = `
        INSERT INTO books (title, price, image, genre, author, "longDescription", pershkrimi, botimi, page, year, "offerPrice", languages, quantity) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;`;
    const values = [
        title, parseFloat(price) || 0, imagePath, (genre || '').split(','), author, longDescription,
        pershkrimi, botimi, parseInt(page, 10) || null, parseInt(year, 10) || null,
        parseFloat(offerPrice) || null,
        JSON.stringify(languagesForDb),
        parseInt(quantity, 10) || 0
    ];
    try {
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (req.file && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        handleServerError(res, err, 'Gabim gjatë shtimit të librit në databazë.');
    }
});

app.put('/api/book/:id', upload.single('image'), async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const { title, price, genre, author, longDescription, pershkrimi, botimi, page, year, offerPrice, languages, quantity, imageUrl } = req.body;
    try {
        const existingBookResult = await pool.query('SELECT image FROM books WHERE id = $1', [bookId]);
        if (existingBookResult.rows.length === 0) return res.status(404).json({ message: 'Libri nuk u gjet.' });
        const oldImagePath = existingBookResult.rows[0].image;
        let imagePath = oldImagePath;
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
            if (oldImagePath && !oldImagePath.startsWith('http') && fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        } else if (imageUrl) {
            imagePath = imageUrl;
            if (oldImagePath && imagePath !== oldImagePath && !oldImagePath.startsWith('http') && fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }
        const languagesForDb = JSON.parse(languages || '[]');
        const query = `
            UPDATE books SET title = $1, price = $2, image = $3, genre = $4, author = $5, "longDescription" = $6, 
            pershkrimi = $7, botimi = $8, page = $9, year = $10, "offerPrice" = $11, languages = $12, quantity = $13 
            WHERE id = $14 RETURNING *;`;
        const values = [
            title, parseFloat(price) || 0, imagePath, (genre || '').split(','), author, longDescription,
            pershkrimi, botimi, parseInt(page, 10) || null, parseInt(year, 10) || null,
            parseFloat(offerPrice) || null,
            JSON.stringify(languagesForDb),
            parseInt(quantity, 10) || 0,
            bookId
        ];
        const result = await pool.query(query, values);
        res.json({ message: 'Libri u përditësua me sukses!', book: result.rows[0] });
    } catch (err) {
        handleServerError(res, err, 'Gabim gjatë përditësimit të librit.');
    }
});

const authorsFilePath = path.join(__dirname, 'Backend', 'featured_authors.json');

app.post('/api/order/checkout', async (req, res) => {
    const { basket, userInfo } = req.body;

    if (!basket || !Array.isArray(basket) || basket.length === 0) {
        return res.status(400).json({ message: "Shporta është bosh ose e pavlefshme." });
    }
    if (!userInfo) {
        return res.status(400).json({ message: "Të dhënat e përdoruesit mungojnë." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const updatePromises = basket.map(item => {
            if (!item.productId || !item.quantity) throw new Error('Artikull i pavlefshëm në shportë.');
            const query = 'UPDATE books SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1';
            return client.query(query, [item.quantity, item.productId]);
        });
        const results = await Promise.all(updatePromises);
        results.forEach((result, index) => {
            if (result.rowCount === 0) throw new Error(`Sasia nuk është e mjaftueshme për librin: ${basket[index].name}`);
        });

        const yourPhoneNumber = '355683544145';
        const yourApiKey = '3060802';
        const authorsSummary = {};
        basket.forEach(item => {
            const bookAuthor = item.author || 'Autor i panjohur';
            if (!authorsSummary[bookAuthor]) {
                authorsSummary喧Summary[bookAuthor] = [];
            }
            authorsSummary[bookAuthor].push(`- ${item.name} (Sasia: ${item.quantity})`);
        });

        let summaryText = '';
        for (const author in authorsSummary) {
            summaryText += `*${author}:*\n${authorsSummary[author].join('\n')}\n\n`;
        }

        const totalCost = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = userInfo.state === 'Shqipëri' ? 200 : userInfo.state === 'Kosovë' ? 500 : 0;
        const finalTotal = totalCost + shippingCost;
        
        const message = `*POROSI E RE NGA FAQJA!* 📢\n\n` +
                        `*Klienti:* ${userInfo.firstName} ${userInfo.lastName}\n` +
                        `*Tel:* ${userInfo.phone}\n` +
                        `*Adresa:* ${userInfo.address}, ${userInfo.city}, ${userInfo.state}\n` +
                        `-------------------------------------\n` +
                        `*Artikujt e Porositur:*\n\n` +
                        `${summaryText}` +
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

app.get('/api/featured-authors', (req, res) => {
    fs.readFile(authorsFilePath, 'utf8', (err, data) => {
        if (err) {
            return handleServerError(res, err, 'Gabim gjatë leximit të skedarit të autorëve.');
        }
        res.json(JSON.parse(data));
    });
});

app.put('/api/featured-authors/:id', upload.single('image'), (req, res) => {
    const authorId = parseInt(req.params.id, 10);
    const { name, nationality, description } = req.body;
    fs.readFile(authorsFilePath, 'utf8', (err, data) => {
        if (err) {
            return handleServerError(res, err, 'Gabim gjatë leximit të skedarit për modifikim.');
        }
        let authors = JSON.parse(data);
        const authorIndex = authors.findIndex(a => a.id === authorId);
        if (authorIndex === -1) {
            return res.status(404).json({ message: 'Autori nuk u gjet.' });
        }
        const oldImagePath = authors[authorIndex].image_url;
        let newImagePath = oldImagePath;
        if (req.file) {
            newImagePath = req.file.path.replace(/\\/g, "/");
            if (oldImagePath && !oldImagePath.startsWith('http') && fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        authors[authorIndex] = {
            ...authors[authorIndex],
            name: name,
            nationality: nationality,
            description: description,
            image_url: newImagePath
        };
        fs.writeFile(authorsFilePath, JSON.stringify(authors, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return handleServerError(res, writeErr, 'Gabim gjatë ruajtjes së ndryshimeve.');
            }
            res.json({ message: 'Autori u përditësua me sukses!', author: authors[authorIndex] });
        });
    });
});

async function synchronizeDatabase() {
    try {
        console.log("Duke kontrolluar dhe sinkronizuar ID-të e databazës...");
        const query = "SELECT setval('books_id_seq', COALESCE((SELECT MAX(id) FROM books), 1), true);";
        await pool.query(query);
        console.log("Sinkronizimi i ID-ve u krye me sukses.");
    } catch (err) {
        console.error("GABIM KRITIK gjatë sinkronizimit të databazës. Sigurohuni që sekuenca 'books_id_seq' ekziston.", err.message);
    }
}

async function startServer() {
    await synchronizeDatabase();
    app.listen(port, () => {
        console.log(`Serveri po funksionon në http://localhost:${port}`);
    });
}

startServer();