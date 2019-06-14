class FontImage {
    /**
     * @param {opentype.Font} font
     * @param {HTMLCanvasElement} canvas
     */
    constructor(font, canvas) {
        this.font = font
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.width = canvas.width
        this.height = canvas.height
        this.textWidth = null
    }

    drawText(text, maxTextHeight) {
        this.ctx.clearRect(0, 0, this.width, this.height)
        let {fitSize, xOffset, yOffset, textWidth} = this._measureSizeAndOffsets(this.font, text, this.height, this.width, maxTextHeight)
        this.font.draw(this.ctx, text, xOffset, yOffset, fitSize)
        this.textWidth = textWidth
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    flipVertically() {
        this.ctx.setTransform(1, 0, 0, -1, 0, this.height);
    }

    flipHorizontally() {
        this.ctx.setTransform(-1, 0, 0, 1, this.width, 0);
    }

    mirror() {
        this.ctx.setTransform(-1, 0, 0, -1, this.width, this.height)
    }

    toBuffer() {
        return this.canvas.toBuffer()
    }

    toGrayscaleArray(isFlatMode) {
        let image = this.ctx.getImageData(0, 0, this.width, this.height)
        let data = image.data
        let pixels = this.width * this.height
        let grayscale1d = []
        for (let i = 0; i < pixels; i++) {
            let r = data[i + 0] // Red characters
            let g = data[i + 1] // Green characters
            let b = data[i + 2] // Blue characters
            let a = data[i + 3] // Alpha characters
            grayscale1d[i] = (255 - (r + g + b) / 3) * (a / 255) // grayscale1d[i] = 255 - (255 - ((r + g + b) / 3 )) * a
            if (typeof grayscale1d[i] === 'undefined') throw new Error('Something went wrong')
        }
        if (!isFlatMode) {
            let grayscale2d = []
            for (let row = 0; row < this.height; row++) {
                let start = row * this.width
                grayscale2d[row] = new Float32Array(grayscale1d.slice(start, start + this.width))
            }
            return grayscale2d
        }
        return new Float32Array(grayscale1d)
    }

    _measureSizeAndOffsets(font, text, imageHeight, imageWidth, textHeight = null) {
        let fontSize = imageHeight
        let fitSize = imageHeight

        let path = font.getPath(text, 0, 0, fontSize)
        let {x1, y1, x2, y2} = path.getBoundingBox()
        let actualFontHeight = y2 - y1
        let actualFontWidth = x2 - x1

        /* -------------------------------------------------------------------
        *  FONT SIZE   = ACTUAL FONT HEIGHT
        *  X FONT SIZE = IMAGE HEIGHT
        *  X FONT SIZE = FONT SIZE * IMAGE HEIGHT / ACTUAL FONT HEIGHT
        *  -------------------------------------------------------------------*/

        fitSize = fontSize / actualFontHeight * imageHeight
        if (textHeight) {
            fitSize = fontSize / actualFontHeight * textHeight
        }
        let scaleFactor = fitSize / fontSize
        x1 = x1 * scaleFactor
        x2 = x2 * scaleFactor
        y1 = y1 * scaleFactor
        y2 = y2 * scaleFactor
        let xOffset = (-x1 + (imageWidth - x2)) / 2
        let yOffset = -(y2 + (imageHeight + y1)) / 2 + imageHeight
        actualFontHeight = y2 - y1
        actualFontWidth = x2 - x1

        return {
            fitSize: fitSize,
            xOffset: xOffset,
            yOffset: yOffset,
            textWidth: actualFontWidth,
            pathHeight: actualFontHeight
        }
    }

}

if (typeof module !== 'undefined') {
    module.exports = {
        FontImage
    }
}
