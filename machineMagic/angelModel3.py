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
print("chkpt 1")
json_file = open(sys.argv[2], 'r')
print("chkpt 11")
loaded_model_json = json_file.read()
print("chkpt 111")
json_file.close()
print("chkpt 1111")

loaded_model = models.model_from_json(loaded_model_json)
print("chkpt 2")
loaded_model.load_weights(sys.argv[3])
print("chkpt 22")    
def preprocess(img_path):
    img = load_img(img_path, target_size = (IMG_WIDTH, IMG_HEIGHT))
    img = img_to_array(img)
    img = np.expand_dims(img, axis = 0)
    return img

print("chkpt 222")
def classify():
    pred = loaded_model.predict(img)
    label = np.argmax(pred, axis=-1)
    name_class = CLASSES[label[0]]
    return name_class

print("chkpt 3")
img_path = sys.argv[1]
print("chkpt 33")
img = preprocess(img_path)
print("chkpt 333")
name_class = classify()
print("chkpt 3333")
print("RR:" + name_class + ":RR" )
