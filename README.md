# VertxCiqual

# Food search engine

## Overview

This application allows you to search for a food by its name in the OpenData CIQUAL food database.
The selection of a food triggers the display of its energy intake for 100 grams, based on a simple formula (lipids / carbohydrates / proteins)

## Getting Started

Clone the repo:
```sh
git clone git@github.com:CyrilLD/VertxCiqual.git
cd VertxCiqual
```

Install yarn:
```js
npm install -g yarn
```

Install dependencies:
```sh
yarn
```

Build Vert.x app:
```sh
# Build app
yarn build
```

Start server:
```sh
# Start server
yarn start
```

==> Navigate to http//localhost:8080 to see the search UI.


## Install Applications
In order to make the application run, you need the following to be running :
  + Java JRE >1.8
  + A MongoDb server
