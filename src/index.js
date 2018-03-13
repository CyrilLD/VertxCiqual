import Router from "vertx-web-js/router";
import StaticHandler from "vertx-web-js/static_handler";
import Vertx from "vertx-js/vertx";
import Buffer from "vertx-js/buffer";
import RecordParser from "vertx-js/record_parser";
import MongoClient from "vertx-mongo-js/mongo_client";
import ParseCsvLine from "parsers/parseCsvLine.js";

/**
 * Config
 */
const config = Vertx.currentContext().config();
const mongoconfig = {
  "connection_string" : config.mongo_db.connection_string || "mongodb://localhost:27017",
  "db_name" : config.mongo_db.db_name || "ciqual"
};


/**
 * Mongo tests
 */
const mongoClient = MongoClient.createShared(vertx, mongoconfig);

const food1 = {
  itemId: "12345",
  name: "Apple",
  kcal: 100
};
mongoClient.save("foods", food1, (id, id_err) =>
  console.log("Inserted id: ", id)
);


/**
 * HTTP Server
 */
const router = Router.router(vertx);

router.route("/*").handler(StaticHandler.create().handle);

// router.get("/").handler((context) => {
//   // This handler will be called for "/" requests
//   const response = context.response();
//   response.putHeader("content-type", "text/plain");
//   // Write to the response and end it
//   response.end("route racine");
// });

router
  .get("/foods")
  .produces("application/json")
  .handler(context => {
    // This handler will be called for "/" requests
    console.log(context.request().getParam("q"));
    const response = context.response();
    response.putHeader("content-type", "text/plain");

    // Write to the response and end it
    //response.end("foods");
    response.end(
      JSON.stringify([
        {
          id: 111,
          label: "food1"
        },
        {
          id: 222,
          label: "food2"
        },
        {
          id: 333,
          label: "food3"
        }
      ])
    );
  });

// Creates and starts HTTP server
const server = vertx.createHttpServer();
server.requestHandler(router.accept).listen(8080);


/**
 * Data loader
 */
const loadDataSource = () => {
  // Cheks config for dataSource
  if (config.dataSource === undefined) {
    throw Error("Datasource not defined. Please check your conf/config.json");
  }
  // Checks existence of datasource file
  if (!vertx.fileSystem().existsBlocking(config.dataSource.path)) {
    throw Error("Data file not found.");
  }

  vertx
    .fileSystem()
    .open(config.dataSource.path, {}, (result, result_err) => {
      if (result_err == null) {
        const file = result;
        file.setReadBufferSize(150000);
        const buff = Buffer.buffer();
        const header = null;
        const data = [];

        let i = 0;
        const parser = RecordParser.newDelimited("\n", h => {
          //console.log('Record parser result:');
          //console.log(h.toString());
          i++;
          if (i % 100 == 0 || i > 2800) {
            console.log(ParseCsvLine(h.toString()));
          }
        });

        parser.endHandler(f => {
          console.log("Parsing done");
          console.log(f);
        });

        file.endHandler(f => {
          console.log("Copy done");
        });

        file.handler((data, err) => {
          console.log("data", data.length());
          //buff.appendBuffer(data);
          parser.handle(data);
        });
      } else {
        console.error("Cannot open file " + result_err);
      }
    });
}

loadDataSource();
