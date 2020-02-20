#!/bin/bash

echo "Concat files in curernt folder to dist/Main.js"

cat *.js  > ./dist/Main.js

# sed -i 's:^import :// import :' $FILE
# sed -i '/^export default/! s:^export :/* export */ :' $FILE
# sed -i 's:^export default :// export default :' $FILE

