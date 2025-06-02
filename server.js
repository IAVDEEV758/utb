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
        console.log(`Attempting to fetch info for URL: ${url}`);
        const info = await ytdl.getInfo(url);
        console.log(`Video title: ${info.videoDetails.title}`);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });

        if (!format) {
            console.log('No suitable video format found');
            return res.status(400).send('Не удалось найти подходящий формат видео');
        }

        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        ytdl(url, { format: format }).pipe(res);
    } catch (error) {
        console.error(`Error downloading video: ${error.message}`, error);
        res.status(500).send(`Ошибка: ${error.message} (Status code: ${error.statusCode || 'unknown'})`);
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});