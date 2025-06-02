#!/bin/bash

# Установка Python и yt-dlp
apt-get update && apt-get install -y python3-pip
pip3 install --user yt-dlp

# Убедись, что yt-dlp будет в PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.profile
