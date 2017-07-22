new york city community boards map
==================================

## work in progress

## Why

This is NYC's official ["Find your community board" page](http://www.nyc.gov/html/cau/html/cb/cb.shtml). To look up your community board you have to figure out how to use their web GIS portal. Why don't we simplify that a little bit? This project is a minimum-viable product inspired by Washington, D.C.'s [ANC Finder](http://ancfinder.org/).

These are some alternatives:

- [Community Districts of New York City - Pediacities](http://nyc.pediacities.com/Community_Districts)
- [Who Represents Me? NYC](http://www.mygovnyc.org/)

## Data sources

- Community district boundaries from [NYC Planning](http://www1.nyc.gov/site/planning/data-maps/open-data/districts-download-metadata.page) ([metadata](http://www1.nyc.gov/assets/planning/download/pdf/data-maps/open-data/nycd_metadata.pdf?ver=17b)). Edition 17b, published June 5, 2017.
- Community board information from [NYC Mayor's Community Affairs Unit - Find Your Community Board](http://www.nyc.gov/html/cau/html/cb/cb.shtml)

### Converting district boundaries to topojson

The source GeoJSON is converted to a TopoJSON to save on space and to resolve topology issues from third-party simplified GeoJSON files. To download the latest boundary file and convert it to a TopoJSON, run in shell:

```sh
./data.sh
```

## Deploy

There are two options for deployment:

To GitHub Pages (default). https://louh.github.io/nyc-community-boards/

```
npm run deploy
```

A surge.sh site. https://nyc-community-boards.surge.sh/

```
npm run deploy:surge
```

Build pipeline and tests will run before deployment.
