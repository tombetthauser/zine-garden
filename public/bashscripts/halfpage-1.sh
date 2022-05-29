set -x # logs all commands in the shell


# ~~~~~ RESET DIRECTORIES ~~~~~ 

#   temp directories
#   for images and pages

rm -rf ./public/zine-images
rm -rf ./public/zine-pages
mkdir ./public/zine-images
mkdir ./public/zine-pages


# ~~~~~ SET ZINE DIMENSIONS ~~~~~ 

#   single side
#   8.5x11 inch paper
#   vertically orientation

xZineImageCount=1
yZineIMageCount=2


# ~~~~~ SET ZINE ORIENTATION ~~~~~ 

#   rotation represents zine orientation
#   first page not always in top left
#   measured in degrees

pageOneRotation=270 


# ~~~~~ SET ZINE RESOLUTION ~~~~~ 

#   determines print resolution
#   calculates zine image resolution
#   assumes an 1/8th inch border
#   on all zine images

#   border percentage represents 1.51%
#   which is 1/8th inch on an 8 1/4 inch print page
#   note 1/8th inch border is taken off 8.5 inch print width

xPageSizePixels=850
yPageSizePixels=1100

xBorderPercent=151 # represents 1.51%
eightInchPixels=$(( (xPageSixePixels * xBorderPercent) / 10000 ))
quarterInchPixels=$(( eighthInchPixels * 2 ))


# set pages needed array

# set image size
# set image rotations array

# set image styling
# set image text array

# set target pages array
# set page x positions array
# set page y positions array

# create blank pages

# resize images
# add style
# add text
# rotate

# place images

# create pdf
# clear out directories