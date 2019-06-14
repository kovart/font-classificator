const fs = require('fs')
const path = require('path')
const {performance} = require('perf_hooks');
const {ImageGenerator} = require('./libs/image-generator')
const {Utils} = require('./libs/utils')
const async = require('async')

const CONFIG = require('./config')

const DESTINATION = CONFIG.destination
const IMAGE_DESTINATION = path.resolve(DESTINATION, CONFIG.imagesDir)
const FONTS_SOURCE = path.resolve(DESTINATION, CONFIG.fontsDir)
const FONT_MAP_FILE = path.resolve(DESTINATION, CONFIG.fontMapFile)
const IMAGE_MAP_FILE = path.resolve(DESTINATION, CONFIG.imageMapFile)

const TEXT = "ahRoGWm"
const PERMUTATION_AMOUNT = 1
const WIDTH = CONFIG.width
const HEIGHT = CONFIG.height
const TEXT_HEIGHT = CONFIG.textHeight

let imageGenerator = new ImageGenerator(WIDTH, HEIGHT, TEXT_HEIGHT)
let fontAttitudeMap = new Map(Utils.shuffle(Object.entries(require(FONT_MAP_FILE)))) // convert Json Object into shuffled Map
let permutations = Utils.permutate(TEXT) // my computer is so slow :(
fs.mkdirSync(IMAGE_DESTINATION, {recursive: true})


console.log(`Loaded fonts: ${fontAttitudeMap.size}`)
console.log(`This script will generate: ${fontAttitudeMap.size * 1} images`)

let fontMap = {}
let fontCount = 1, estimate = 0 /* used to calculate the time left */
async.each(fontAttitudeMap, function([fontName, font], cb) {
    console.log(`[${fontCount++}/${fontAttitudeMap.size}][${Utils.formatTime(estimate)}] Generating: ${fontName}`)
    let iterationStartTime = performance.now()

    let newFont = {
        attitude: font.attitude,
        subFamilies: []
    }

    for(let subFamily of font.subFamilies){
        let newSubFamily = {
            name: subFamily.name,
            permutations: []
        }
        newFont.subFamilies.push(newSubFamily)

        let file = subFamily.path
        let fontPath = path.resolve(FONTS_SOURCE, file)
        let fileBasename = path.basename(file)
        fileBasename = fileBasename.slice(0, fileBasename.lastIndexOf('.')) // remove extension

        // Checking if the font has all of the needed characters
        if (!fontHasAllCharacters(imageGenerator.generate(fontPath, TEXT), TEXT)) {
            console.log(`\x1b[35mFont "${fontName}" hasn't some characters so it was skipped\x1b[37m`)
            return cb()
        } else {
            fontMap[fontName] = newFont
        }

        // Get random permutations
        for (let text of Utils.shuffle(permutations).slice(0, PERMUTATION_AMOUNT)) {
            let dest = path.resolve(IMAGE_DESTINATION, fileBasename + '-' + text + '.png')
            let image = imageGenerator.generate(fontPath, text)
            fs.writeFileSync(dest, image.toBuffer())
            newSubFamily.permutations.push({
                text: text,
                path: fileBasename + '-' + text + '.png'
            })
        }
    }
    estimate = Utils.average(Math.round((fontAttitudeMap.size - fontCount) * (performance.now() - iterationStartTime)))
    cb()
}, function(err){
    fs.writeFileSync(IMAGE_MAP_FILE, JSON.stringify(fontMap), {encoding: 'utf8'})
    if(err) console.error(err)
    else console.log('Images have successfully generated')
})



function fontHasAllCharacters(font, characters) {
    for (let character of characters) {
        if (font.font.glyphNames.names.indexOf(character) === -1) return false
    }
    return true
}

