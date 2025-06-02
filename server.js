const express = require('express');
const ytdl = require('ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/download', async (req, res) => {
    const url = req.query.url;
    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).send('Некорректная ссылка на видео');
    }

    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });

        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        ytdl(url, { format: format }).pipe(res);
    } catch (error) {
        res.status(500).send(`Ошибка: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});