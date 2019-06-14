import os
import png
import numpy as np
import libs.tools as tools


def load_grayscale_image(path):
    reader = png.Reader(path)
    w, h, pixels, metadata = reader.asDirect()
    pixel_byte_width = 4 if metadata['alpha'] else 3
    image_array = []
    for row in pixels:
        row_array = []
        for p in range(0, w * pixel_byte_width, pixel_byte_width):
            if row[p + 3] > 0:  # if not transparent
                grayscale = (255 - (row[p + 0] + row[p + 1] + row[p + 2]) / 3) * (row[p + 3] / 255)
            else:
                grayscale = 0
            row_array.append(255 - grayscale)
        image_array.append(row_array)
    return np.array(image_array)


def load_grayscale_images(directory, is_flat_mode, display=False):
    image_paths = tools.get_files(directory)
    images = []
    for idx, path in enumerate(image_paths):
        if display:
            print('\r[%d/%d] Loading image: %s                ' % (idx + 1, len(image_paths), os.path.basename(path)), end="", flush=True)
        image = load_grayscale_image(path)
        if is_flat_mode:
            image = np.reshape(image, image.shape[0] * image.shape[1])
        images.append(image)
    print('')
    return images
