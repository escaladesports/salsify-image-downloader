'use strict'
const salsify = require('salsify-to-json')
const salsifyImgs = require('./index')

salsify({
		ids: [ 'T8681W', 'T1265' ],
		out: './json'
	})
	.then(() => {
		return salsifyImgs({
			src: './json',
			out: './img'
		})
	})
	.then(() => console.log('Done!'))
	.catch(console.error)
