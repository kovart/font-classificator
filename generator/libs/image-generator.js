const OpenType = require('opentype.js')
const {createCanvas} = require('canvas')
const {FontImage} = require('./font-image')

const ImageOperations = {
    HorizontalFlip: 'horizontal-flip',
    VerticalFlip: 'vertical-flip',
    Mirror: 'mirror',
}


class ImageGenerator {
    constructor(width, height, textHeight) {
        this.width = width
        this.height = height
        this.textHeight = textHeight
    }

    generate(fontFile, text, operation = null) {
        let font = OpenType.loadSync(fontFile)
        let canvas = createCanvas(this.width, this.height)
        let image = new FontImage(font, canvas)

        if (operation) {
            // There are no built-in methods to flip canvas image after drawing it
            // So we apply a transform operation to the canvas before we draw the text
            if (operation === ImageOperations.HorizontalFlip) image.flipHorizontally()
            else if (operation === ImageOperations.VerticalFlip) image.flipVertically()
            else if (operation === ImageOperations.Mirror) image.mirror()
        }
        image.drawText(text, this.textHeight)
        return image
    }

}

module.exports = {
    ImageOperations,
    ImageGenerator
}
