import Router from "vertx-web-js/router";
import Vertx from "vertx-js/vertx";
import Buffer from "vertx-js/buffer";
import RecordParser from "vertx-js/record_parser";
import MongoClient from "vertx-mongo-js/mongo_client";
import ParseCsvLine from "parsers/parseCsvLine.js";


const server = vertx.createHttpServer();
const router = Router.router(vertx);

const StaticHandler = require("vertx-web-js/static_handler");
router.route("/*").handler(StaticHandler.create().handle);

const config = Vertx.currentContext().config();
const mongoconfig = {
  "connection_string" : config.mongo_uri || "mongodb://localhost:27017",
  "db_name" : config.mongo_db || "ciqual"
};
const mongoClient = MongoClient.createShared(vertx, mongoconfig);


const food1 = {
  "itemId" : "12345",
  "name" : "Apple",
  "kcal" : 100
};
mongoClient.save("foods", food1, (id, id_err) => console.log("Inserted id: " + id));



// router.get("/").handler(function (context) {
//   // This handler will be called for "/" requests
//   const response = context.response();
//   response.putHeader("content-type", "text/plain");
//   // Write to the response and end it
//   response.end("route racine");
// });

router.get("/foods").produces("application/json").handler((context) => {
  // This handler will be called for "/" requests
  console.log(context.request().getParam("q"));
  const response = context.response();
  response.putHeader("content-type", "text/plain");

  // Write to the response and end it
  //response.end("foods");
  response.end(JSON.stringify([
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
  ]))

});

server.requestHandler(router.accept).listen(8080);


console.log(vertx.fileSystem().existsBlocking("assets/data/TableCiqual2017.csv"));

vertx.fileSystem().open("assets/data/TableCiqual2017.csv", {
}, function (result, result_err) {
  if (result_err == null) {
    const file = result;
    file.setReadBufferSize(150000);
    const buff = Buffer.buffer();
    const header = null;
    const data = [];

    const i = 0;
    const parser = RecordParser.newDelimited("\n", (h) => {
      //console.log('Record parser result:');
      //console.log(h.toString());
      i++;
      if (i % 100 == 0 || i > 2800) {
        console.log(ParseCsvLine(h.toString()));
      }

    });

    parser.endHandler((f) => {
      console.log("Parsing done");
      console.log(f);
    });

    file.endHandler((f) => {
      console.log("Copy done");
    });

    file.handler((data, err) => {
      console.log('data', data.length());
      //buff.appendBuffer(data);
      parser.handle(data);
    })

  } else {
    console.error("Cannot open file " + result_err);
  }
});
