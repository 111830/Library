const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD;

app.post('/api/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: 'Ju lutem shkruani fjalëkalimin.' });
    }

    if (password === MANAGER_PASSWORD) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Fjalëkalimi i pasaktë!' });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Image/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const booksFilePath = path.join(__dirname, 'Backend', 'Librat.json');

const handleServerError = (res, error, message) => {
    console.error(message, error);
    return res.status(500).json({ message: message, error: error.message });
};

app.post('/shto-liber', upload.single('image'), (req, res) => {
    const textData = req.body;
    const uploadedFile = req.file;

    // --- Diagnostikim ---
    console.log('--------------------------');
    console.log('Received data on server (SHTO LIBER):');
    console.log(req.body);
    console.log('--------------------------');
    // --- Fund Diagnostikim ---

    if (!uploadedFile) {
        return res.status(400).json({ message: 'Ju lutem ngarkoni një foto.' });
    }

    fs.readFile(booksFilePath, 'utf8', (err, data) => {
        if (err) {
            return handleServerError(res, err, 'Gabim gjatë leximit të skedarit të librave.');
        }

        try {
            let booksData = JSON.parse(data);
            const newId = booksData.length > 0 ? Math.max(...booksData.map(book => book.id)) + 1 : 1;

            const oldPath = uploadedFile.path;
            const fileExtension = path.extname(uploadedFile.originalname);
            const newPath = path.join('Image', `${newId}${fileExtension}`);
            fs.renameSync(oldPath, newPath);
            
            let languages = textData.languages ? JSON.parse(textData.languages) : [];

            const newBook = {
                id: newId,
                title: textData.title,
                price: parseInt(textData.price, 10) || 0,
                image: newPath.replace(/\\/g, "/"),
                genre: textData.genre ? textData.genre.split(',') : [],
                author: textData.author,
                longDescription: textData.longDescription,
                Pershkrimi: textData.Pershkrimi,
                Botimi: textData.Botimi,
                Page: textData.Page,
                year: parseInt(textData.year, 10) || null,
                offerPrice: parseFloat(textData.offerPrice) || null,
                languages: languages
            };

            booksData.push(newBook);

            fs.writeFile(booksFilePath, JSON.stringify(booksData, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    return handleServerError(res, writeErr, 'Gabim gjatë ruajtjes së librit të ri.');
                }
                res.status(201).json(newBook);
            });
        } catch (parseError) {
            return handleServerError(res, parseError, 'Gabim gjatë përpunimit të të dhënave të dërguara.');
        }
    });
});

app.get('/api/book/search', (req, res) => {
    const titleQuery = req.query.title;
    if (!titleQuery) {
        return res.json([]);
    }

    fs.readFile(booksFilePath, 'utf8', (err, data) => {
        if (err) {
            return handleServerError(res, err, 'Gabim në server gjatë kërkimit.');
        }
        
        try {
            const books = JSON.parse(data);
            const foundBooks = books.filter(book => book.title.toLowerCase().includes(titleQuery.toLowerCase()));
            res.json(foundBooks);
        } catch (parseError) {
            return handleServerError(res, parseError, 'Gabim gjatë përpunimit të skedarit JSON.');
        }
    });
});

app.put('/api/book/:id', upload.single('image'), (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const updatedData = req.body;
    
    // --- Diagnostikim ---
    console.log('--------------------------');
    console.log('Received data on server (PERDITESO LIBER):');
    console.log(req.body);
    console.log('--------------------------');
    // --- Fund Diagnostikim ---

    fs.readFile(booksFilePath, 'utf8', (err, data) => {
        if (err) {
             return handleServerError(res, err, 'Gabim gjatë leximit të skedarit të librave për përditësim.');
        }
        
        try {
            let books = JSON.parse(data);
            const bookIndex = books.findIndex(book => book.id === bookId);

            if (bookIndex === -1) {
                return res.status(404).json({ message: 'Libri nuk u gjet për përditësim.' });
            }

            let languages = updatedData.languages ? JSON.parse(updatedData.languages) : [];
            const existingBook = books[bookIndex];

            const newBookData = {
                ...existingBook,
                title: updatedData.title || existingBook.title,
                price: parseInt(updatedData.price, 10) || existingBook.price,
                genre: updatedData.genre ? updatedData.genre.split(',') : existingBook.genre,
                author: updatedData.author || existingBook.author,
                longDescription: updatedData.longDescription || existingBook.longDescription,
                Pershkrimi: updatedData.Pershkrimi || existingBook.Pershkrimi,
                Botimi: updatedData.Botimi || existingBook.Botimi,
                Page: updatedData.Page || existingBook.Page,
                year: parseInt(updatedData.year, 10) || existingBook.year,
                offerPrice: parseFloat(updatedData.offerPrice) || null,
                languages: languages
            };

            if (req.file) {
                const oldImagePath = path.join(__dirname, existingBook.image);
                if (existingBook.image && fs.existsSync(oldImagePath)) {
                    try { 
                        fs.unlinkSync(oldImagePath);
                    } catch(e) { 
                        console.log("Gabim: Fotoja e vjetër nuk u gjet ose nuk u fshi dot, vazhdojmë.", e);
                    }
                }
                newBookData.image = req.file.path.replace(/\\/g, "/");
            }

            books[bookIndex] = newBookData;

            fs.writeFile(booksFilePath, JSON.stringify(books, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                     return handleServerError(res, writeErr, 'Gabim gjatë ruajtjes së ndryshimeve në skedar.');
                }
                res.json({ message: 'Libri u përditësua me sukses!', book: newBookData });
            });
        } catch (parseError) {
             return handleServerError(res, parseError, 'Gabim gjatë përpunimit të të dhënave për përditësim.');
        }
    });
});

app.listen(port, () => {
    console.log(`Serveri po funksionon në http://localhost:${port}`);
});