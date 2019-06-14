import numpy as np
import os
import shutil
from sklearn.utils import shuffle


# TODO Fix performance
def unison_shuffled_copies(a, b):
    assert len(a) == len(b)
    p = np.random.permutation(len(a)).ravel()
    # return np.array(a)[p].tolist(), np.array(b)[p].tolist()
    return shuffle(a, b, random_state=0)


def get_dirs(path) -> []:
    return [os.path.join(path, f) for f in os.listdir(path) if os.path.isdir(os.path.join(path, f))]


def get_files(folder) -> []:
    return [os.path.join(folder, f) for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]


def copy_from_dir(from_dir, to_dir):
    for filename in os.listdir(from_dir):
        if not os.path.isfile(os.path.join(from_dir, filename)):
            continue
        shutil.copy(os.path.join(from_dir, filename), to_dir)


def copy_files(files: [], to_dir: str):
    for file in files:
        shutil.copy(file, to_dir)


def split(a_array, amount):
    a = a_array[len(a_array) - amount:]
    b = a_array[:-amount]
    return b, a