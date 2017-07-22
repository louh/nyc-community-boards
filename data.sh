#!/bin/bash

# Source data
# via http://www1.nyc.gov/site/planning/data-maps/open-data/districts-download-metadata.page
DISTRICTS_GEO="http://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson"
TARGET_DIR="./public/data"

NODE_MODULE_DIR='./node_modules/.bin'
NDJSON_SPLIT="$NODE_MODULE_DIR/ndjson-split"
NDJSON_MAP="$NODE_MODULE_DIR/ndjson-map"
GEO2TOPO="$NODE_MODULE_DIR/geo2topo"
TOPO_QUANTIZE="$NODE_MODULE_DIR/topoquantize"
TOPO_SIMPLIFY="$NODE_MODULE_DIR/toposimplify"

# Make sure the `geo2topo' command is installed.
if [ ! -e $GEO2TOPO ]; then
  echo "local geo2topo command not found, please run npm install first" 1>&2
  exit 1
fi

# Download and convert to TopoJSON.
# The object must be named `districts`
# Promote the GeoJSON property BoroCD to object id and throw the rest away
# Simplify the points, because there's a lot of coastline
# Slightly more precise quantization than default
# TODO: Test for optimum quantization / simplication parameters
curl $DISTRICTS_GEO \
  | $NDJSON_SPLIT 'd.features' \
  | $NDJSON_MAP 'd.id = d.properties.BoroCD, delete d.properties, d' \
  | $GEO2TOPO -n districts=- \
  | $TOPO_SIMPLIFY -s 3e-12 \
  | $TOPO_QUANTIZE 1e6 \
  > $TARGET_DIR/districts.topojson
