numA=5
numB=5

for arg in "$@"
do
  if [[ $arg = nums:* ]]
  then
    tempNums=(${arg//:/ })
    numA=${tempNums[1]}
    numB=${tempNums[2]}
  fi
done

echo $numA
echo $numB
echo $((numA + numB))



# dog=false
# cat=false

# for arg in "$@"
# do
#   if [[ $arg = ca* ]]
#   then
#     cat=true
#   fi
# done

# if [ $cat = true ]
# then
#   echo "HEY THERE DOGGY"
# fi


# relativePageOrders=(1 3 4 2) # <--- set these manually for different zine layouts
# relativePageOrdersLength=${#relativePageOrders[@]}

# zineImageCount=6
# maxImagePlacementNumber=1

# # rename all zine image files for correct order
# for ((i=0; i<$((zineImageCount)); i++)); do
#   relativeOrder=${relativePageOrders[$((i % relativePageOrdersLength))]}
#   pageNumber=$((((i) / 4))) # <-- first page is zero since divide will always round down
#   absoluteOrder=$(((pageNumber * 4) + relativeOrder))

#   if [ $absoluteOrder -gt $maxImagePlacementNumber ]
#   then
#     maxImagePlacementNumber=$absoluteOrder
#   fi
# done

# echo $maxImagePlacementNumber


# foo=test

# if [ -f ./${foo}* ]
# then 
#   echo "found!"
# else
#   echo "not found!"
# fi




# if test 1 -lt 0 
# then echo success!
# elif test 1 -lt 10
# then echo what!
# else echo ok!
# fi

# echo end!



# # set -x


# # 1 image = 1 page

# # 2 images = 2 pages
# # 3 images = 2 pages
# # 4 images = 2 pages

# # 5 images = 3 pages

# # 6 images = 4 pages
# # 7 images = 4 pages
# # 8 images = 4 pages

# # 9 images = 5 pages

# # 10 images = 6 pages
# # 10 images = 6 pages
# # 10 images = 6 pages

# zineImageCount=7

# pageMax=2
# sheetMax=4

# pagesNeeded=$(((zineImageCount / pageMax) + (zineImageCount % pageMax > 0)))

# echo 1-page

# for ((i=1; i<${pagesNeeded}; i++)); do
#   echo $((i+1))-page
# done

