import tensorflow as tf
import keras
import numpy as np
import sys
from keras.utils import load_img, img_to_array
from keras import models

FRUIT = 'banana'
CLASSES = [' freshripe',' freshunripe',' overripe',' ripe',' rotten',' unripe']
IMG_WIDTH, IMG_HEIGHT = 224, 224

# loaded_model = load_model(FRUIT+'_model')
json_file = open(FRUIT+'_model.json', 'r')
loaded_model_json = json_file.read()
json_file.close()

loaded_model = models.model_from_json(loaded_model_json)
loaded_model.load_weights(FRUIT+"_weights.h5")

def preprocess(img_path):
    img = load_img(img_path, target_size = (IMG_WIDTH, IMG_HEIGHT))
    img = img_to_array(img)
    img = np.expand_dims(img, axis = 0)
    return img

def classify():
    pred = loaded_model.predict(img)
    label = np.argmax(pred, axis=-1)
    name_class = CLASSES[label[0]]
    return name_class

img_path = sys.argv[1]
img = preprocess(img_path)
name_class = classify()
print("RR:" + name_class + ":RR" )
