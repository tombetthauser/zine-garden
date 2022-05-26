# ~~~~~~~~~~ GENERAL SETUP ~~~~~~~~~~~~~~~~~~~~

# log failures / actions in the shell
set -x

# first we delete and recreate our zine images directory
# we copy all of our original input images into this directory to manipulate
rm /app/public/uploads/dummy-file.txt
rm -rf /app/public/zine-images
cp -r /app/public/uploads /app/public/zine-images

# also delete the zine pages folder if it exists and remake it empty
rm -rf /app/public/zine-pages
mkdir /app/public/zine-pages

rm -rf /app/public/output
mkdir /app/public/output

# then we capture all the filenames in an array
# we grab the length for reference also since thats a pain in bash
zineImageFileNames=(/app/public/zine-images/*)
zineImageCount=${#zineImageFileNames[@]}

# now we set the max number of images per page
# we also set the maximum number of image that can be on a sheet which could be calculated too
pageMax=2
sheetMax=4

# now we calculate the number of pages we'll need
# this may need to be adjusted for larger zine counts and should be tested
# it divides the total number of images for the zine by how many can fit on the page rounding down
# then it adds another tow pages (one double-sided print sheet) if there were any leftover pages
# its good this is here but it really shouldnt be used
# zine page counts should be adjusted to fit evenly onto desired print layout without blank end pages
pagesNeeded=$(((zineImageCount / pageMax)+((zineImageCount % pageMax > 0 ) * 2)))

# below are the pixel dimensions for page files which represent resolution
# these will determine how pixellated or compressed any styling done later on is
# comment them in and out freely to experiment

# xPageSizePixels=3400
# yPageSizePixels=4400

# xPageSizePixels=1700
# yPageSizePixels=2200

xPageSizePixels=850
yPageSizePixels=1100

# xPageSizePixels=425
# yPageSizePixels=550

# xPageSizePixels=217
# yPageSizePixels=275




# ~~~~~~~~~~ CREATE BLANK PAGES ~~~~~~~~~~~~~~~~~~~~

# this approach makes blank pages first to overlay the images onto later
# making the blank page files doesn't need to happen first but might as well
# first it makes a single starter blank page to copy which speed things up

# convert -size ${xPageSizePixels}x${yPageSizePixels} xc:white /app/public/zine-pages/1-page.png
convert -size ${xPageSizePixels}x${yPageSizePixels} xc:lime /app/public/zine-pages/1-page.png


# then it makes all blank pages in new directory
# this is just faster than making each page with convert
for ((i=1; i<${pagesNeeded}; i++)); do
  cp /app/public/zine-pages/1-page.png /app/public/zine-pages/$(($i+1))-page.png
  
done




# ~~~~~~~~~~ RESIZE IMAGE FILES ~~~~~~~~~~~~~~~~~~~~
# this determines the desired individual image size 
# this will allow us so simply place it on the page files by coordinate
# these could be calculated dynamically but can be determined manually
# its easier to do with a physical mockup
# percentages were determined by measuring in 1/8th inch units
# could also have been done with millimeters
# image sizes are percentages of total page height / width accounting for 1/8th inch border gaps
# the border gaps are to match the 1/8th inch unprited white boarder on most home printers

xImagePercent=9706 # represents 97.06% <-- set this manually for different zine layouts
yImagePercent=4773 # represents 47.73% <-- set this manually for different zine layouts

# calculate percentages into pixels
yImageSizePixels=$(((xImagePercent * xPageSizePixels) / 10000)) # <-- division simulates percentage
xImageSizePixels=$(((yImagePercent * yPageSizePixels) / 10000))
# note that bash only uses integers so perform calculation manually before running script

# this resizes all images in place
# this has to happen after rotation right now but should be changed for efficiency later
for ((i=0; i<$((zineImageCount)); i++)); do
  zineImage=${zineImageFileNames[$((i))]}
  convert $zineImage -resize $((xImageSizePixels))x$((yImageSizePixels))^ -gravity center -extent $((xImageSizePixels))x$((yImageSizePixels)) $zineImage
done




# ~~~~~~~~~~ ROTATE IMAGE FILES ~~~~~~~~~~~~~~~~~~~~

# this uses a rotation pattern array with numbers representing clockwise degrees
# it can be referenced dynamically for any page number with some modulus arithmatic
# the pattern here is tricky since it needs to be applied before reordering the images for page placement
# this is best calculated manually with a physical mock-up of the zine size

rotations=(270 270 90 90) # <--- set these manually for different zine layouts
rotationsLength=${#rotations[@]}

for ((i=0; i<$((zineImageCount)); i++)); do
  rotation=${rotations[$((i % rotationsLength))]}
  zineImage=${zineImageFileNames[$((i))]}
  convert $zineImage -rotate $rotation $zineImage
done




# # ~~~~~~~~~~  RESIZE IMAGE FILES ~~~~~~~~~~~~~~~~~~~~

# # this determines the desired individual image size 
# # this will allow us so simply place it on the page files by coordinate
# # these could be calculated dynamically but can be determined manually
# # its easier to do with a physical mockup
# # percentages were determined by measuring in 1/8th inch units
# # could also have been done with millimeters
# # image sizes are percentages of total page height / width accounting for 1/8th inch border gaps
# # the border gaps are to match the 1/8th inch unprited white boarder on most home printers

# xImagePercent=9706 # represents 97.06% <-- set this manually for different zine layouts
# yImagePercent=4773 # represents 47.73% <-- set this manually for different zine layouts

# # calculate percentages into pixels
# xImageSizePixels=$(((xImagePercent * xPageSizePixels) / 10000)) # <-- division simulates percentage
# yImageSizePixels=$(((yImagePercent * yPageSizePixels) / 10000))
# # note that bash only uses integers so perform calculation manually before running script

# # this resizes all images in place
# # this has to happen after rotation right now but should be changed for efficiency later
# for ((i=0; i<$((zineImageCount)); i++)); do
#   zineImage=${zineImageFileNames[$((i))]}
#   convert $zineImage -resize $((xImageSizePixels))x$((yImageSizePixels))^ -gravity center -extent $((xImageSizePixels))x$((yImageSizePixels)) $zineImage
# done




# ~~~~~~~~~~ CALCULATE IMAGE ORDER FOR PAGES ~~~~~~~~~~~~~~~~~~~~

# this renames the pages based on the order they should be added to the pages
# this gets more complicated the smaller the zine gets
# its best figured out with a physical mockup of the zine size
# this array can give us the correct relative orders for any image count with some modulus arithmatic
# the first image for a page will get reordered to the number at index 0 in the array
# the second will be assigned the relative order number at index 1 and so on
# the pattern repeats for every print sheet meaning front and back

relativePageOrders=(1 3 4 2) # <--- set these manually for different zine layouts
relativePageOrdersLength=${#relativePageOrders[@]}

# rename all zine image files for correct order
for ((i=0; i<$((zineImageCount)); i++)); do
  zineImage=${zineImageFileNames[$((i))]}
  relativeOrder=${relativePageOrders[$((i % relativePageOrdersLength))]}
  pageNumber=$((((i) / 4))) # <-- first page is zero since divide will always round down
  absoluteOrder=$(((pageNumber * 4) + relativeOrder))
  
  # use some horrible bash syntax to separate the filetype for renaming
  extension="${zineImage##*.}"
  newFileName=/app/public/zine-images/$((absoluteOrder))-ordered.$extension
  mv $zineImage /app/public/zine-images/$((absoluteOrder))-ordered.$extension
done




# ~~~~~~~~~~ CALCULATE IMAGE POSITION COORDINATES ~~~~~~~~~~~~~~~~~~~~

# coordinates are split into two arrays so they can be easily looked up in later iteration
# there are only two coordinates because this is a half page zine with two images per page
# more coordinates can be added here for smaller zines
# they start as percentages and are translated to pixels based on page size

xCoordinatesPercentages=(147 147) # representing 1.47% 1.47%
yCoordinatesPercentages=(114 5114) # representing 1.14% 51.14%

xCoordinatesPercentagesLength=${#xCoordinatesPercentages[@]}
yCoordinatesPercentagesLength=${#yCoordinatesPercentages[@]}

xCoordinatesPixels=()
yCoordinatesPixels=()

# calculate these percentages into pixels and add to coordinate arrays
# again bash cant do floating point numbers so percentages are calculated with integers
for ((i=0; i<$((xCoordinatesPercentagesLength)); i++)); do
  pixelValue=$(((xCoordinatesPercentages[$i] * xPageSizePixels) / 10000))
  xCoordinatesPixels+=($pixelValue)
done

for ((i=0; i<$((yCoordinatesPercentagesLength)); i++)); do
  pixelValue=$(((yCoordinatesPercentages[$i] * yPageSizePixels) / 10000))
  yCoordinatesPixels+=($pixelValue)
done




# ~~~~~~~~~~ ADD IMAGES TO PAGES ~~~~~~~~~~~~~~~~~~~~

# recollect new image names
zineImageFileNames=(/app/public/zine-images/*)

# place all zine images on pages in new order alternating positions
for ((i=0; i<$((zineImageCount)); i++)); do
  zineImage=${zineImageFileNames[$((i))]}
  xPosition=$((xCoordinatesPixels[$((i % xCoordinatesPercentagesLength))]))
  yPosition=$((yCoordinatesPixels[$((i % yCoordinatesPercentagesLength))]))
  pageNumber=$((((i) / 2) + 1)) # first page is zero since divide will always round down

  magick composite -geometry +$((xPosition))+$((yPosition)) $zineImage /app/public/zine-pages/$((pageNumber))-page.png /app/public/zine-pages/$((pageNumber))-page.png
done




# ~~~~~~~~~~ STYLE PAGES ~~~~~~~~~~~~~~~~~~~~

# collect page file names and length then iterate through
pageFileNames=(/app/public/zine-pages/*)
pageFileCount=${#pageFileNames[@]}

for ((i=0; i<$((pageFileCount)); i++)); do
  # grab page name and apply imagemagick styling
  pageFileName=${pageFileNames[$((i))]}
  # convert $pageFileName -colorspace gray -ordered-dither o2x2 $pageFileName

  # magick $pageFileName -color-threshold 'sRGB(163,112,0)-sRGB(203,152,40)' $pageFileName
  # magick $pageFileName -color-threshold 'sRGB(0,0,0)-sRGB(150,150,150)' $pageFileName
  # convert $pageFileName -colorspace gray -edge 1 -fuzz 1% -trim +repage $pageFileName
  # magick $pageFileName -colorspace gray -color-threshold 'gray(46.4152%)-gray(55.3278%)' $pageFileName
  # convert $pageFileName -negate $pageFileName
  convert $pageFileName -ordered-dither o2x2 $pageFileName # <--- color dither
  # convert $pageFileName -colorspace gray -ordered-dither o2x2 $pageFileName # <--- black and white dither
  # convert $pageFileName -colorspace RGB -fuzz 15% -fill red -opaque black $pageFileName
  # convert $pageFileName -colorspace RGB -fuzz 15% -fill blue -opaque black $pageFileName
  
  # get rid of lime placeholder color
  convert $pageFileName -colorspace RGB -fuzz 1% -fill white -opaque lime $pageFileName
done




# ~~~~~~~~~~ INCREASE PAGE RESOLUTION FOR PRINT ~~~~~~~~~~~~~~~~~~~~

# this is to help retain the pixel sharpness on lower resolution dithers etc
# the conversion to a jpeg is to help speed up printing

for ((i=0; i<$((pageFileCount)); i++)); do
  pageFileName=${pageFileNames[$((i))]}

  convert $pageFileName -filter point -resize 1700x2200 $pageFileName
  magick $pageFileName /app/public/zine-pages/$((i))-page.jpg
  rm $pageFileName
done



# ~~~~~~~~~~ COMBINE INTO SINGLE PDF ~~~~~~~~~~~~~~~~~~~~
currentTime=`date -u +%s`
# rm /app/public/output/zine.pdf
magick convert /app/public/zine-pages/* /app/public/output/zine.pdf

# open zine-${currentTime}.pdf




# ~~~~~~~~~~ CLEAR OUT FILES ~~~~~~~~~~~~~~~~~~~~

rm /app/public/zine-images/*
rm /app/public/zine-pages/*
# rm /app/public/uploads/*
echo hello >> /app/public/uploads/dummy-file.txt