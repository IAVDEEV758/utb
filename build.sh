#!/bin/bash

# Установим yt-dlp через pip
pip install yt-dlp

# Сохраним путь в $PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.profile
