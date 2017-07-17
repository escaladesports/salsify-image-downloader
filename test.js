'use strict'
require('dotenv').config({ silent: true })
const salsify = require('salsify-to-json')
const salsifyImgs = require('./index')

salsify({
		ids: [ 'T8681W' ],
		out: './json'
	})
	.then(() => salsifyImgs({
		src: './json',
		out: './img'
	}))
	.then(obj => {
		if(obj) console.log(obj)
		console.log('Done!')
	})
	.catch(console.error)
