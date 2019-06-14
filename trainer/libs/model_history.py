import keras
import pickle
import os


class ModelHistory(keras.callbacks.Callback):
    def __init__(self, filepath: str = 'history.pickle', save_per_epoch=False):
        keras.callbacks.Callback.__init__(self)
        self.filepath = filepath
        self.save_per_epoch = save_per_epoch

    def on_train_begin(self, logs={}):
        self.loss_train = []
        self.acc_train = []
        self.loss_valid = []
        self.acc_valid = []

    def on_epoch_end(self, epoch, logs={}):
        self.loss_train.append(logs.get('loss'))
        self.acc_train.append(logs.get('acc'))
        self.loss_valid.append(logs.get('val_acc'))
        self.acc_valid.append(logs.get('val_loss'))
        if self.save_per_epoch:
            self.save()
            print('History saved')

    def on_train_end(self, logs):
        self.save()

    def save(self):
        with open(self.filepath, 'wb') as f:
            pickle.dump(self.get(), f)

    def get(self):
        return {
            'loss': self.loss_train,
            'val_loss': self.loss_valid,
            'acc': self.acc_train,
            'val_acc': self.acc_valid,
        }

    def set(self, history):
        self.acc_train = history.get('acc')
        self.acc_valid = history.get('val_acc')
        self.loss_train = history.get('loss')
        self.loss_valid = history.get('val_loss')

    def load(self):
        if not os.path.exists(self.filepath):
            return False
        with open(self.filepath, 'rb') as f:
            data_new = pickle.load(f)
            self.set(data_new)
            return True
