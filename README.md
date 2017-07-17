# Salsify Image Downloader

Fetches Salsify images and compresses/resizes them for web.

## Installation

```bash
yarn add escaladesports/salsify-image-downloader
```

## Usage

```js
const salsifyImgs = require('salsify-image-downloader')
salsifyImgs({
		in: './json',
		out: './img'
	})
	.then(() => console.log('Done!'))
	.catch(console.error)
```
