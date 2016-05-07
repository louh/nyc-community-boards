#!/bin/bash

# Source data
DISTRICTS_GEO="http://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson"
TEMP_DIR="./temp"
TARGET_DIR="./site/data"
TOPOJSON="./node_modules/.bin/topojson"

# Make sure the `topojson' command is installed.
if [ ! -e $TOPOJSON ]; then
  echo "local topojson command not found, please run npm install first" 1>&2
  exit 1
fi

# Make the temporary download / processing directory
mkdir -p temp

# Get the source district boundary geojson
curl $DISTRICTS_GEO > $TEMP_DIR/districts.geojson

# Convert to TopoJSON.
# GeoJSON property 'BoroCD' is promoted to the object id in TopoJSON
# Slightly more precise quantization than default
# But we simplify the points, because there's a lot of coastline
# TODO: Test for optimum quantization / simplication parameters
$TOPOJSON -o $TARGET_DIR/districts.topojson --id-property BoroCD -q 1e6 -s 3e-12 $TEMP_DIR/districts.geojson
