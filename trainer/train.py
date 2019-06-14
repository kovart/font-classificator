import math
import os
import json

import numpy as np
from keras import backend as K
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D, Dense, Flatten, Dropout
from keras.callbacks import ModelCheckpoint  # basic class for specifying and training a neural network
# Helper functions
from keras_preprocessing.image import ImageDataGenerator
from sklearn.preprocessing import LabelBinarizer

from libs.image_loader import load_grayscale_image
import libs.tools as tools
# Visualize training history
import matplotlib
import matplotlib.pyplot as plt

matplotlib.use("Agg")

# TODO
# Read about class weight to bypass class imbalancing
# https://stackoverflow.com/questions/48485870/multi-label-classification-with-class-weights-in-keras?rq=1

# CONSTANTS
# -----------------
dataset_map_file = '../data/1001fonts/image-map.json'
labels_file = '../data/1001fonts/tags.json'
image_dir = '../data/1001fonts/images'

train_ratio = 0.7
valid_ratio = 0.15
test_ratio = 1 - train_ratio - valid_ratio

batch_size = 21 * 3
num_epochs = 15

checkpoint_dir = '../models/model_checkpoints/'
checkpoint_file = checkpoint_dir + 'model_checkpoint-{epoch:02d}.h5'
checkpoint_period = 3


# -----------------


def read_data(items):
    items = items[:10]
    x = []
    y = []
    for i, (fontName, font) in enumerate(items):
        print('\r{:8} | Loading {:40}'.format('{}/{}'.format(i + 1, len(items)), fontName), sep=' ', end='', flush=True)
        for subfamily in font['subFamilies']:
            for permutation in subfamily['permutations']:
                file_path = os.path.join(image_dir, permutation['path'])
                image = load_grayscale_image(file_path)
                x.append(image)
                y.append(font['attitude'])
    x = np.asarray(x, dtype=np.float16)
    y = np.asarray(y, dtype=np.int)
    x = x / 255  # normalize
    x, y = tools.unison_shuffled_copies(x, y)
    return x, y


f = open(labels_file, "r")
labels = json.load(f)
f.close()


def read_dataset(file_path):
    with open(file_path, "r") as file:
        data_map = json.load(file)
        items = list(data_map.items())
        length = len(items)
        train_length = math.floor(length * train_ratio)
        valid_length = math.floor(length * valid_ratio)
        # test_length = math.floor(length * test_ratio)
        print('Loading train data...')
        x_train, y_train = read_data(items[0:train_length])
        print('\nLoading valid data...')
        x_valid, y_valid = read_data(items[train_length:train_length + valid_length])
        print('\nLoading test data...')
        x_test, y_test = read_data(items[train_length + valid_length:])
        return x_train, y_train, x_valid, y_valid, x_test, y_test


print('Loading dataset...')

X_train, Y_train, X_valid, Y_valid, X_test, Y_test = read_dataset(dataset_map_file)

height = X_train[0].shape[0]
width = X_train[0].shape[1]
depth = 1
class_amount = len(Y_train[0])
class_weights = {k: len(Y_train) / (class_amount * (Y_train == k).sum()) for k in range(class_amount)}

print('\nReshaping data...')
X_train = np.reshape(X_train, newshape=(X_train.shape[0], X_train.shape[1], X_train.shape[2], 1))
X_test = np.reshape(X_test, newshape=(X_test.shape[0], X_test.shape[1], X_test.shape[2], 1))
X_valid = np.reshape(X_valid, newshape=(X_valid.shape[0], X_valid.shape[1], X_valid.shape[2], 1))


# Loss function definition

def calculating_class_weights(y_true):
    from sklearn.utils.class_weight import compute_class_weight
    number_dim = np.shape(y_true)[1]
    weights = np.empty([number_dim, 2])
    for i in range(number_dim):
        weights[i] = compute_class_weight('balanced', [0., 1.], y_true[:, i])
    return weights


def get_weighted_loss(weights):
    def weighted_loss(y_true, y_pred):
        return K.mean(
            (weights[:, 0] ** (1 - y_true)) * (weights[:, 1] ** (y_true)) * K.binary_crossentropy(y_true, y_pred),
            axis=-1)

    return weighted_loss


model = Sequential([
    Conv2D(filters=32, kernel_size=(5, 5), activation='relu', input_shape=(height, width, depth)),
    MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
    Dropout(0.25),
    Conv2D(filters=16, kernel_size=(3, 3), activation='relu'),
    MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
    Dropout(0.5),
    Conv2D(filters=32, kernel_size=(3, 3), activation='relu'),
    MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
    Dropout(0.35),
    Flatten(),
    Dense(512, activation='relu'),
    Dropout(0.5),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(class_amount, activation='sigmoid')
])
model.compile(loss=get_weighted_loss(class_weights), optimizer='adadelta', metrics=['accuracy'])

datagen = ImageDataGenerator(
    vertical_flip=True,
    horizontal_flip=True,
    width_shift_range=math.floor(width / 3),
    fill_mode='wrap'
)

# compute quantities required for featurewise normalization
# (std, mean, and principal components if ZCA whitening is applied)
datagen.fit(X_train)

os.makedirs(checkpoint_dir, exist_ok=True)
checkpointer = ModelCheckpoint(filepath=checkpoint_file, monitor='val_loss', verbose=1, save_best_only=True,
                               period=checkpoint_period)

# fits the model on batches with real-time data augmentation:
history = model.fit_generator(
    datagen.flow(X_train, Y_train, batch_size=batch_size),
    validation_data=(X_valid, Y_valid),
    steps_per_epoch=len(X_train) / batch_size,
    use_multiprocessing=True,
    epochs=num_epochs,
    callbacks=[checkpointer]
)

model.save('../models/last_model.h5')

# create the label binarizer for one-hot encoding labels, then encode
# the testing labels
lb = LabelBinarizer()
lb.fit(list(labels))

# y_pred = model.predict(X_test)
# # show a nicely formatted classification report
# print("[INFO] evaluating network...")
# print(classification_report(Y_test, y_pred, labels))

evaluation = model.evaluate(X_test, Y_test, verbose=1)  # Evaluate the trained model on the test set!

print('X_train amount: %s || X_test amount: %s' % (X_train.shape[0], X_test.shape[0]))
print('Summary: Loss over the test dataset: %.2f, Accuracy: %.2f' % (evaluation[0], evaluation[1]))

# Plot training & validation accuracy values
plt.plot(history.history['acc'])
plt.plot(history.history['val_acc'])
plt.title('Model accuracy')
plt.ylabel('Accuracy')
plt.xlabel('Epoch')
plt.legend(['Train', 'Test'], loc='upper left')
plt.show()
plt.savefig("accuracy.png")

# Plot training & validation loss values
plt.plot(history.history['loss'])
plt.plot(history.history['val_loss'])
plt.title('Model loss')
plt.ylabel('Loss')
plt.xlabel('Epoch')
plt.legend(['Train', 'Test'], loc='upper left')
plt.show()
plt.savefig("loss.png")
