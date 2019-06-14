const fs = require('fs')
const path = require('path')
const OpenType = require('../node_modules/opentype.js/src/opentype')
const {createCanvas} = require('canvas')
const FSHelper = require('./fs-helper')
const {FontImage} = require('../libs/font-image')

/* ----------------------------
 * This script is not used now.
 * But it has much cool stuff,
 * so I decided to keep this code.
 * ---------------------------- */


const ImageOperations = {
    HorizontalFlip: 'horizontal-flip',
    VerticalFlip: 'vertical-flip',
    Mirror: 'mirror',
}

class DataGenerator {
    /**
     * @param options - Options
     * @param {string} options.source
     * @param {string} options.destination
     * @param {number} options.width
     * @param {number} options.height
     * @param {string} options.text
     * @param {number} options.textHeight
     * @param {boolean} options.shouldSaveLeftovers
     * @param {boolean} options.shouldMirror
     * @param {boolean} options.shouldPermutate
     * @param {boolean} options.shouldFlipVertically
     * @param {boolean} options.shouldFlipHorizontally
     */
    constructor(options) {
        this.options = options
        this.categories = FSHelper.getDirectories(options.source).map(d => {
            return {
                name: path.basename(d),
                location: d,
                files: FSHelper.getFiles(d)
            }
        })
    }

    generate(options) {
        if(!options) options = this.options
        let smallestCategory = this._findSmallestCategory(this.categories)
        let operationCount = (options.shouldPermutate ? Utils.factorial(options.text.length) : 1) *
            (1 + options.shouldMirror + options.shouldFlipHorizontally + options.shouldFlipVertically)

        let imageCount = Math.floor(smallestCategory.files.length) * operationCount
        let leftoversCount = (this.categories.reduce((accumulator, curr) => accumulator + curr.files.length, 0) * operationCount) -
            (imageCount * this.categories.length)

        console.log('-'.repeat(30))
		console.log(`Directory: ${options.source}`)
        this.categories.forEach(c => console.log(`Fonts in category '${c.name}': ${c.files.length}`))
        console.log(`The smallest category '${smallestCategory.name}' has ${smallestCategory.files.length} fonts.`)
        console.log(`Characters to generate: ${options.text}`)
        console.log('Augmentation arguments: \n' +
            ` - Permutation: ${options.shouldPermutate}\n` +
            ` - Mirroring: ${options.shouldMirror}\n` +
            ` - Horizontal Flip: ${options.shouldFlipHorizontally}\n` +
            ` - Vertical Flip: ${options.shouldFlipVertically}`)
        console.log(`Image variations: ${operationCount}`)
        console.log(`Balanced amount of images per category: ${imageCount}`)
        console.log(`Leftover images (in total): ${leftoversCount}`)

        let fontOperations = this._generateOperations(options)
        for(let category of this.categories){
            console.log('-'.repeat(30))
            console.log(`Category: ${category.name}`)
            console.log('-'.repeat(30))

            let files = Utils.shuffle(category.files)

            let operationsMap = new Map()
            files.forEach(f => operationsMap.set(f, [...fontOperations]))

            let distDir = path.resolve(options.destination, category.name)
            FSHelper.createDirRecursively(distDir)

            console.log(`Generating images...`)
            for(let i = 0; i < imageCount; i++){
                let file = files[i%files.length]
                let fontName = path.basename(file).split('.')[0]
                let operations = operationsMap.get(file)
                let operation = operations.splice(Math.floor(Math.random() * operations.length), 1)[0]
                let image = this._performOperation(file, operation, options)
                let dest = path.resolve(distDir, fontName + `_${operation.characters}-${operation.name}` + '.png')
                Utils.logInline(`[${i + 1}/${imageCount}] Generating image for: ${fontName}`)
                this._saveImage(dest, image)
            }
            console.log('')

            if(options.shouldSaveLeftovers){
                console.log('Generating leftover data...')
                let leftoversDir = path.resolve(options.destination, 'leftovers', category.name)
                FSHelper.createDirRecursively(leftoversDir)
                for(let [file, operations] of operationsMap){
                    let fontName = path.basename(file).split('.')[0]
                    if(!operations.length) continue
                    operations.forEach((operation, i) => {
                        let image = this._performOperation(file, operation, options)
                        let dest = path.resolve(leftoversDir, path.basename(file).split('.')[0] + `_${operation.characters}-${operation.name}` + '.png')
                        Utils.logInline(`[${category.name}][${i+1}/${operations.length}] Generating images for: ${fontName}`)
                        this._saveImage(dest, image)
                    })
                }
                console.log('')
            }
        }
        console.log('-'.repeat(30))
        console.log(`All images are generated.`)
    }

    _generateOperations(options){
        let operations = []
        let charPermutations = [options.text]
        if(options.shouldPermutate) charPermutations = Utils.permutate(options.text)
        for(let characters of charPermutations){
            operations.push({ name: 'text', characters: characters })
            if(options.shouldMirror) operations.push({ name: ImageOperations.Mirror, characters: characters })
            if(options.shouldFlipVertically) operations.push({ name: ImageOperations.VerticalFlip, characters: characters })
            if(options.shouldFlipHorizontally) operations.push({ name: ImageOperations.HorizontalFlip, characters: characters })
        }
        return operations
    }

    _performOperation(file, operation, options){
        let image = this._generateImage(file, operation.characters, options.width, options.height, options.textHeight, operation)
        return image
    }

    _findSmallestCategory(categories) {
        let smallest = categories[0]
        for (let dir of categories) {
            if (dir.files.length < smallest.files.length) smallest = dir
        }
        return smallest
    }

    _generateImage(file, text, width, height, textHeight = null, operation = null) {
        let font = OpenType.loadSync(file)
        let canvas = createCanvas(width, height)
        let image = new FontImage(font, canvas)

        // There are no built-in methods to flip canvas image after drawing it
        // So we apply a transform operation to the canvas before we draw text
        if(operation.name === ImageOperations.HorizontalFlip) image.flipHorizontally()
        else if(operation.name === ImageOperations.VerticalFlip) image.flipVertically()
        else if(operation.name === ImageOperations.Mirror) image.mirror()
        image.drawText(text, textHeight)
        return image
    }

    _saveImage(dest, image){
        fs.writeFileSync(dest, image.toBuffer())
    }
}

const Utils = {
    factorial(n) {
        return (n < 2) ? 1 : Utils.factorial(n - 1) * n;
    },
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },
    permutate(str) {
        let results = [];

        if (str.length === 1) {
            results.push(str);
            return results;
        }

        for (let i = 0; i < str.length; i++) {
            let firstChar = str[i];
            let otherChar = str.substring(0, i) + str.substring(i + 1);
            let otherPermutations = Utils.permutate(otherChar);

            for (let j = 0; j < otherPermutations.length; j++) {
                results.push(firstChar + otherPermutations[j]);
            }
        }
        return results;
    },
    logInline(msg){
        let whiteline = Array(process.stdout.columns).join(" ")
        process.stdout.write(whiteline + "\r");
        process.stdout.write(msg + "\r");
    }
}

module.exports = {
    DataGenerator
}
