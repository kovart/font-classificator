const async = require('async')
const download = require('download')
const path = require('path')
const fs = require('fs')

// This script downloads scraped fonts
// It saves: 
//  * CONFIG.fontsDir - font files
//  * CONFIG.fontMapFile - to map files and their tags in one hot encoding
//  * CONFIG.tagOrderFile - to define tag order

const CONFIG = require('./config')

const DESTINATION = CONFIG.destination
const FONTS_DIR = path.resolve(DESTINATION, CONFIG.fontsDir)
const MAP_FILE = path.resolve(DESTINATION, CONFIG.fontMapFile)
const ORDER_FILE = path.resolve(DESTINATION, CONFIG.tagOrderFile)

const SCRAPED_FONTS_FILE = path.resolve(DESTINATION, CONFIG.scrapedFontsFile)

const CONCURRENCY = 5
const ERROR_LIMIT = 15
const RETRY_LIMIT = 3
const ScrapedFonts = require(SCRAPED_FONTS_FILE)
// I want to download fonts with at least one of this tags
const TAGS = [
    'display',
    ['script', 'handwritten', 'handwriting', 'calligraphy'], // the same names
    'sans serif',
    'serif',
    'poster',
    'grunge',
    'eroded',
    'fat',
    'outlined',
    'comic',
    'retro',
    'rough',
    'techno',
    'vintage',
    'blocky',
    'futuristic',
    'dingbat',
    'rounded',
    '3d',
    'modern',
]

const FontMap = {} // Will be saved as CONFIG.fontMapFile
const TagOrder = [] // Will be saved as CONFIG.tagOrderFIle
TAGS.forEach(t => {
    // Choose only the first name from the array of similar tag names  
    if(Array.isArray(t)) TagOrder.push(t[0])
    else TagOrder.push(t)
})


let GlobalErrorCount = 0

let queue = async.queue(function ({font, subFamily, errors}, cb) {
    download(subFamily.download, FONTS_DIR)
        .then(() => {
            FontMap[font.name].subFamilies.push({
                name: subFamily.name,
                path: path.resolve(FONTS_DIR, path.basename(subFamily.download))
            })
            console.log(`Font '${subFamily.name}' has been downloaded from: ${subFamily.download}`)
            cb()
        }).catch(cb)
}, CONCURRENCY)

queue.drain = function () {
    console.log('Download operations have successfully completed')
    fs.writeFileSync(MAP_FILE, JSON.stringify(FontMap), {encoding:'utf8'})
    fs.writeFileSync(ORDER_FILE, JSON.stringify(TagOrder), {encoding:'utf8'})
}

queue.error = function (error, task) {
    console.error('-'.repeat(40))
    console.error(`Errors count: ${GlobalErrorCount}`)
    console.error(`URL: ${task.url} \nTask errors: ${task.errors.length}`)
    console.error(error)
    console.error('-'.repeat(40))

    task.errors.push(error)
    if (task.errors.length === 1) GlobalErrorCount++
    if (GlobalErrorCount > ERROR_LIMIT) {
        console.log('Too many errors. Scraping has stopped')
        return queue.kill()
    }
    if (task.errors.length > RETRY_LIMIT) {
        console.log(`Retry limit (${RETRY_LIMIT}) is exceeded for: ${task.url}`)
    } else {
        queue.pause()
        console.log('Waiting for 5s...')
        setTimeout(function () {
            queue.push(task)
            queue.resume()
        }, 5000)
    }
}


const flatTags = makeFlat(TAGS)
for(let font of ScrapedFonts){
    if(!flatTags.find(t => font.tags.indexOf(t) !== -1)) continue

    let tagAttitude = {}
    TagOrder.forEach(a => tagAttitude[a] = 0) // Generate zero-attitude map
    for(let tag of TAGS){
        if(Array.isArray(tag) && tag.find(t => font.tags.indexOf(t) !== -1)) {
            tagAttitude[tag[0]] = 1
        } else if(font.tags.indexOf(tag) !== -1){
            tagAttitude[tag] = 1
        }
    }

    FontMap[font.name] = {
        attitude: TagOrder.map(a => tagAttitude[a]),
        subFamilies: []
    }

    for(let subFamily of font.subFamilies){
        queue.push({
            font,
            subFamily,
            errors: []
        })
    }
}


function makeFlat(arr){
    return arr.reduce((accumulator, curr) => {
        Array.isArray(curr) ? accumulator.push(...curr) : accumulator.push(curr)
        return accumulator
    }, [])
}
