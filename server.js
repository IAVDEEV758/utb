const express = require('express');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/download', async (req, res) => {
    const url = req.query.url;
    const start = req.query.start || '0';
    const end = req.query.end || null;

    if (!url) {
        console.log('No URL provided');
        return res.status(400).send('Некорректная ссылка на видео');
    }

    try {
        console.log(`Fetching info for URL: ${url}`);
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36']
        });

        console.log(`Video title: ${info.title}`);
        const title = info.title.replace(/[^\w\s]/gi, '');
        const videoFormat = info.formats.find(format => format.vcodec !== 'none' && format.acodec !== 'none');

        if (!videoFormat) {
            console.log('No suitable video format found');
            return res.status(400).send('Не удалось найти подходящий формат видео');
        }

        const outputFile = path.join(__dirname, `${title}.mp4`);
        if (end) {
            const tempFile = path.join(__dirname, `temp-${title}.mp4`);
            await new Promise((resolve, reject) => {
                ffmpeg(videoFormat.url)
                    .setStartTime(start)
                    .setDuration(end - start)
                    .output(tempFile)
                    .on('end', () => {
                        res.download(tempFile, `${title}.mp4`, (err) => {
                            if (err) console.error(`Download error: ${err.message}`);
                            fs.unlink(tempFile, () => {});
                        });
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`FFmpeg error: ${err.message}`);
                        reject(err);
                    })
                    .run();
            });
        } else {
            res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
            res.redirect(videoFormat.url);
        }
    } catch (error) {
        console.error(`Error downloading video: ${error.message}`, {
            stderr: error.stderr,
            stack: error.stack
        });
        res.status(500).send(`Ошибка: ${error.message} (Details: ${error.stderr || 'unknown'})`);
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});