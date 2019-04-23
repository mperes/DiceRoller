import os
import shutil
import glob

currentdirecotry =  os.getcwd()
source = os.path.join(currentdirecotry, "saga" + os.sep + "*.js")
destination = os.path.join(currentdirecotry, "libs" + os.sep + "saga.js")

if os.path.exists(destination):
  os.remove(destination)

with open(destination, 'wb') as outfile:
    for filename in glob.glob(source):
        with open(filename, 'rb') as readfile:
            shutil.copyfileobj(readfile, outfile)
