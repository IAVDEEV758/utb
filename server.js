const express = require('express');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
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
        const { stdout } = await execPromise(`yt-dlp --dump-json "${url}"`);
        const info = JSON.parse(stdout);
        console.log(`Video title: ${info.title}`);
        const title = info.title.replace(/[^\w\s]/gi, '');

        const tempFile = path.join(__dirname, `temp-${title}.mp4`);
        const outputFile = path.join(__dirname, `${title}.mp4`);

        // Скачиваем видео с помощью yt-dlp
        await execPromise(`yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${tempFile}" "${url}"`);

        if (end) {
            // Обрезка видео с помощью ffmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(tempFile)
                    .setStartTime(start)
                    .setDuration(end - start)
                    .output(outputFile)
                    .on('end', () => {
                        res.download(outputFile, `${title}.mp4`, (err) => {
                            if (err) console.error(`Download error: ${err.message}`);
                            fs.unlink(tempFile, () => {});
                            fs.unlink(outputFile, () => {});
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
            res.download(tempFile, `${title}.mp4`, (err) => {
                if (err) console.error(`Download error: ${err.message}`);
                fs.unlink(tempFile, () => {});
            });
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