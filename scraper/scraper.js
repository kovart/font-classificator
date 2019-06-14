const needle = require('needle')
const $ = require('cheerio')
const fs = require('fs-extra')
const async = require('async')
const path = require('path')

// This script scrapes fonts from 1001fonts.com
// It saves the only "CONFIG.scrapedFontsFile" file 
// with information about font names, their tags, and links to download

const CONFIG = require('./config')

const DESTINATION = CONFIG.destination
const FONTS_FILE = path.resolve(DESTINATION, CONFIG.scrapedFontsFile)

const CONCURRENCY = 5
const PAGE_LIMIT = 1030
const RETRY_LIMIT = 3
const ERROR_LIMIT = 14
const URL = 'https://www.1001fonts.com/most-popular-fonts.html'


let GlobalErrorCount = 0
let fontMap = new Map() // we use map to avoid font duplication if pagination has changed


const queue = async.queue(function (task, cb) {
	needle.get(task.url, function (error, response) {
		if (error || response.statusCode !== 200) {
			error = error || new Error(`Status code: ${response.statusCode}`)
			return cb(error)
		}
		if(task.type === 'pagination') {
			let fonts = parsePaginationPage(response.body)
			fonts.forEach(f => {
				queue.push({
					type: 'font',
					url: f.url,
					errors: [] // this is used to know should we retry or not
				})
			})
			console.log(`Pushed ${fonts.length} new fonts from: ${task.url}`)
		} else if(task.type === 'font') {
			let font = parseFontPage(response.body)
			if(font.isDemo) return cb()
			delete font.isDemo
			fontMap.set(font.name, font)
			console.log(`Parsed font: ${font.name}. Tags: ${font.tags.slice(0, Math.min(font.tags.length, 5)).join(', ')}`)
		}
		cb()
	})
}, CONCURRENCY)

queue.drain = function () {
	console.log('Crawling is done')
	fs.mkdirSync(DESTINATION, {recursive: true})
	fs.writeFileSync(path.resolve(DESTINATION, FONTS_FILE), JSON.stringify(Array.from(fontMap.values())))
}

queue.error = function (error, task) {
	console.error('-'.repeat(40))
	console.error(`Errors count: ${GlobalErrorCount}`)
	console.error(`Task type: ${task.type}. URL: ${task.url} \nTask errors: ${task.errors.length}`)
	console.error(error)
	console.error('-'.repeat(40))

	task.errors.push(error)
	if (task.errors.length === 1) GlobalErrorCount++
	if (GlobalErrorCount > ERROR_LIMIT) {
		console.log('Too many errors. Crawling has stopped')
		return queue.kill()
	}
	if (task.errors.length > RETRY_LIMIT) {
		console.log(`Retry limit (${RETRY_LIMIT}) is exceeded for: ${url}`)
	} else {
		queue.pause()
		console.log('Waiting for 5s...')
		setTimeout(function () {
			queue.push(task)
			queue.resume()
		}, 5000)
	}
}

/* ------------------
 * THE ENTRY POINT
 * ------------------ */

needle.get(URL, function (error, response) {
	// Get the response from the URL, parse the number of pages and add them to the queue

	if (error || response.statusCode !== 200) {
		return console.error(error || response.body)
	}

	let pageAmount = Math.min(PAGE_LIMIT, parseInt($('div#pageNav a.l', response.body).text()))
	console.log(`URL: ${URL}`)
	console.log(`Pages to scrape: ${pageAmount}`)
	// Add pagination tasks
	async.times(pageAmount, (n, next) => {
		queue.push({url: URL + `?page=${n + 1}`, type: 'pagination', errors: []});
		next()
	})
})


/* ------------------
 * PARSE FUNCTIONS
 * ------------------ */

function parseFontPage(html){
	let isDemo = false
	let subFamilies = new Map()
	let tags = []
	let name = $('#headlineInfo h1', html).text()
	name = name.slice(0, name.indexOf('Font')-1) // remove 'Font' or 'Font Family' from the name

	if($('.json-description', html).text().search(/demo/im) !== -1) return { isDemo: true }

	let subFamilyElems = $('.fontPreview.r5px.dimmer', html)
	subFamilyElems.each((i, elem) => {
		let font = {
			name: $('span.fontName.dimmed.floatLeft', elem).text(),
			download: $('a.button.ext.extA', elem).attr('href')
		}
		subFamilies.set(font.name, font)
	})
	let tagElems = $('em ul.tags li a', html)
	tagElems.each((i, elem) => {
		tags.push($(elem).text())
	})

	return {
		name,
		tags,
		subFamilies: Array.from(subFamilies.values()),
		isDemo,
	}
}

function parsePaginationPage(html){
	let fonts = []
	let fontElems = $('.fontPreviewWrapper', html)
	fontElems.each((i, el) => {
		fonts.push({
			name: $('span.fontName', el).text(),
			url: 'https:' + $('a.fontPreviewImg', el).attr('href'),
		})
	})
	return fonts
}
