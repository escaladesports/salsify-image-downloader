'use strict'
const path = require('path')
const fs = require('fs-extra')
const request = require('request').defaults({ encoding: null })
const glob = require('glob-all')
const sharp = require('sharp')


/*
TODO:
- delete old image files
*/

// Find existing JSON Salsify image data
function findImgFiles(obj){
	return new Promise((resolve, reject) => {
		obj.log('Getting local image JSON file...')
		fs.readJson(`${obj.out}/_salsify-images.json`)
			.then(data => {
				obj.local = data
				resolve(obj)
			})
			.catch(() => {
				obj.local = {}
				resolve(obj)
			})
	})
}

// Find existing JSON Salsify data
function findSrcFiles(obj){
	return new Promise((resolve, reject) => {
		obj.log('Getting local product JSON files...')
		glob(`${obj.src}/*.json`, (err, files) => {
			if(err) reject(err)
			else{
				const promises = []
				for(let i = 0; i < files.length; i++){
					promises[i] = addSalsifyImages(files[i], obj)
				}
				Promise.all(promises)
					.then(() => resolve(obj))
					.catch(reject)
			}
		})
	})
}

// Collects Salsify image data for downloading
function addSalsifyImages(srcFile, obj){
	return new Promise((resolve, reject) => {
		fs.readJson(srcFile)
			.then(data => {
				const assets = assetsToObject(data['salsify:digital_assets'])
				for(let i = obj.fields.length; i--;){
					const field = obj.fields[i]
					if(field in data){
						if(typeof data[field] === 'string'){
							data[field] = [ data[field] ]
						}
						for(let i = data[field].length; i--;){
							const imgId = data[field][i]
							if(
								!(imgId in obj.newImgs) &&
								imgId in assets &&
								(
									!obj.local[imgId] ||
									obj.local[imgId].timestamp != assets[imgId].timestamp
								)
							){
								obj.newImgs[imgId] = assets[imgId]
							}
						}
					}
				}
				resolve(obj)
			})
			.catch(reject)
	})
}

// Turns Salsify assets array into an object
function assetsToObject(arr){
	const obj = {}
	if(!arr) return obj
	if(typeof arr === 'string') arr = [ arr ]
	for(let i = arr.length; i--;){
		const asset = arr[i]
		obj[asset['salsify:id']] = {
			url: asset['salsify:url'],
			timestamp: asset['salsify:updated_at'] ||
				asset['salsify:created_at']
		}
	}
	return obj
}


// Saves, resizes, and logs images
function saveImages(obj){
	return new Promise((resolve, reject) => {
		let promises = []
		obj.progress = 0
		obj.total = Object.keys(obj.newImgs).length
		for(let i in obj.newImgs){
			promises.push(processImage(i, obj.newImgs[i], obj))
		}
		Promise.all(promises)
			.then(() => resolve(obj))
			.catch(reject)
	})
}


// Processes a single new image
function processImage(imgId, imgObj, obj){
	return new Promise((resolve, reject) => {
		downloadImage(imgId, imgObj.url, obj)
			.then(resolve)
			.catch(reject)
	})
}
function downloadImage(id, url, obj){
	return new Promise((resolve, reject) => {
		let filename = `${obj.out}/${id}${path.extname(url)}`
		obj.log(`Reading image "${url}"...`)

		url = path.parse(url)
		url.dir = `${url.dir}/w_${obj.width}/dn_72`
		url = path.format(url)

		request(url, (err, res, body) => {
			if(err) return reject(err)
			//const buffer = new Buffer(body).toString('base64')
			fs.outputFile(filename, body)
				.then(() => {
					obj.progress++
					obj.log(`Saved image "${url}". (${obj.progress}/${obj.total})`)
					resolve()
				})
				.catch(reject)
		})
	})
}

function saveConfig(obj){
	return new Promise((resolve, reject) => {
		for(let i in obj.newImgs){
			obj.local[i] = obj.newImgs[i]
		}
		fs.writeJson(`${obj.out}/_salsify-images.json`, obj.local, { spaces: '\t' })
			.then(resolve)
			.catch(reject)
	})
}





module.exports = obj => {
	return new Promise((resolve, reject) => {
		obj = Object.assign({
			log: console.log,
			fields: [ 'Web Images' ],
			width: 900,
			newImgs: {},
			removeImgs: {}
		}, obj)
		if(typeof obj.fields === 'string'){
			obj.fields = [ obj.fields ]
		}
		findImgFiles(obj)
			.then(findSrcFiles)
			.then(saveImages)
			.then(saveConfig)
			.then(resolve)
			.catch(reject)
	})
}
