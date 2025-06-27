const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

const MANAGER_PASSWORD = 'admin123';

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

app.post('/shto-liber', upload.single('image'), (req, res) => {
    const textData = req.body;
    const uploadedFile = req.file;

    if (!uploadedFile) {
        return res.status(400).json({ message: 'Ju lutem ngarkoni një foto.' });
    }

    fs.readFile(booksFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Gabim në server.' });
        }

        let booksData = JSON.parse(data);
        const newId = booksData.length > 0 ? Math.max(...booksData.map(book => book.id)) : 0;
        const finalId = newId + 1;

        const oldPath = uploadedFile.path;
        const fileExtension = path.extname(uploadedFile.originalname);
        const newPath = path.join('Image', `${finalId}${fileExtension}`);
        fs.renameSync(oldPath, newPath);

        const newBook = {
            id: finalId,
            title: textData.title,
            price: parseInt(textData.price),
            image: newPath.replace(/\\/g, "/"),
            genre: textData.genre.split(','),
            author: textData.author,
            longDescription: textData.longDescription,
            Pershkrimi: textData.Pershkrimi,
            Botimi: textData.Botimi,
            Page: textData.Page,
            year: parseInt(textData.year),
            offerPrice: parseFloat(textData.offerPrice) || null
        };

        booksData.push(newBook);

        fs.writeFile(booksFilePath, JSON.stringify(booksData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ message: 'Gabim gjatë ruajtjes.' });
            }
            res.status(201).json(newBook);
        });
    });
});

app.get('/api/book/search', (req, res) => {
    const titleQuery = req.query.title;
    if (!titleQuery) {
        return res.json([]);
    }

    fs.readFile(booksFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Gabim në server.' });
        }
        
        const books = JSON.parse(data);
        const foundBooks = books.filter(book => book.title.toLowerCase().includes(titleQuery.toLowerCase()));
        res.json(foundBooks);
    });
});

app.put('/api/book/:id', upload.single('image'), (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const updatedData = req.body;
    
    fs.readFile(booksFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Gabim në server.' });
        }
        
        let books = JSON.parse(data);
        const bookIndex = books.findIndex(book => book.id === bookId);

        if (bookIndex === -1) {
            return res.status(404).json({ message: 'Libri nuk u gjet për përditësim.' });
        }

        const existingBook = books[bookIndex];
        const newBookData = {
            ...existingBook,
            title: updatedData.title,
            price: parseInt(updatedData.price),
            genre: updatedData.genre.split(','),
            author: updatedData.author,
            longDescription: updatedData.longDescription,
            Pershkrimi: updatedData.Pershkrimi,
            Botimi: updatedData.Botimi,
            Page: updatedData.Page,
            year: parseInt(updatedData.year),
            offerPrice: parseFloat(updatedData.offerPrice) || null
        };

        if (req.file) {
            if (existingBook.image && fs.existsSync(existingBook.image)) {
                try { 
                    fs.unlinkSync(existingBook.image);
                } catch(e) { 
                    console.log("Gabim: Fotoja e vjetër nuk u gjet për t'u fshirë, vazhdojmë.");
                }
            }
            newBookData.image = req.file.path.replace(/\\/g, "/");
        }

        books[bookIndex] = newBookData;

        fs.writeFile(booksFilePath, JSON.stringify(books, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ message: 'Gabim gjatë ruajtjes së ndryshimeve.' });
            }
            res.json({ message: 'Libri u përditësua me sukses!', book: newBookData });
        });
    });
});

app.listen(port, () => {
    console.log(`Serveri po funksionon në http://localhost:${port}`);
});