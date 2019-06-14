const fs = require('fs')
const path = require('path')

// This script analyzes tags of scraped fonts
// Generates json file with tag names sorted by fonts amount 

const CONFIG = require('./config')

const DESTINATION = CONFIG.destination
const FONTS_FILE = path.resolve(DESTINATION, CONFIG.scrapedFontsFile)
const RESULT_FILE = path.resolve(DESTINATION, CONFIG.analysisFile)

// Minimal amount of fonts for target tags
const MIN_FONTS = 300

const fonts = require(FONTS_FILE)

let stat = new Map()
// Push
console.log('Pushing tags...')
let count = 1
for(let font of fonts){
    console.log(`[${count++}/${fonts.length}] Pusing tags from: ${font.name}`)
    for(let tag of font.tags){
        if(typeof stat.get(tag) === 'undefined') stat.set(tag, [])
        stat.get(tag).push({ name: font.name, subFamilies: font.subFamilies })
    }
}
// Sort
let statArray = []
stat.forEach((val, key) => statArray.push({tag: key, fonts: val}))
statArray.sort((a, b) => b.fonts.length - a.fonts.length)
statArray = statArray.filter(s => s.fonts.length > MIN_FONTS)
// Save
fs.writeFileSync(RESULT_FILE, JSON.stringify(statArray))
// Print
console.log('-'.repeat(40))
console.log(`Tags: ${statArray.length}`)
console.log('The most popular: ')
statArray.splice(0, statArray.length).forEach(s => console.log(s.tag + ": " + s.fonts.length))
