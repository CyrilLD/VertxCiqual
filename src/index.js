/**
 * OpenData Manipulation tool
 * @module src/index
 * @author Cyril LD
 */
import Router from "vertx-web-js/router";
import StaticHandler from "vertx-web-js/static_handler";
import Vertx from "vertx-js/vertx";
import Buffer from "vertx-js/buffer";
import RecordParser from "vertx-js/record_parser";
import MongoClient from "vertx-mongo-js/mongo_client";

import ParseCsv from "parsers/parseCsv.js";
import Aggregators from "aggregators";

/**
 * Vert.x Config
 */
const config = Vertx.currentContext().config();
let serviceReady = false;

/**
 * MongoDb connexion
 */
const mongoconfig = {
  connection_string: config.mongo_db.connection_string || "mongodb://localhost:27017",
  db_name: config.mongo_db.db_name || "ciqual"
};
const mongoClient = MongoClient.createShared(vertx, mongoconfig);

/**
 * HTTP Server
 */
const router = Router.router(vertx);
// Route static contents in /webroot folder
router.route("/*").handler(StaticHandler.create().handle);

/**
 * @api {get} /foods SearchFoods
 * @apiName SearchFoods
 * @apiDescription Searchs foods in database containing the provided string.
 *
 * @apiParam { String } ?startWith= Indicates if the searched string must be on the beginning of foods names
 * @apiParam { String } ?q= Query string used to find foods
 */
router
  .get("/foods")
  .produces("application/json")
  .handler(context => {
    if (serviceReady === false) {
      return context
        .response()
        .setStatusCode(503)
        .end("Service is not ready");
    }

    const startWith = context.request().getParam("startWith") === "1" ? "^" : "";
    const search = context
      .request()
      .getParam("q")
      .trim();
    const query = {
      alim_nom_fr: {
        $regex: `${startWith}${search}`,
        $options: "i"
      }
    };

    // Performs a regex search on MongoDb
    mongoClient.find("foods", query, (res, err) => {
      if (err == null) {
        const foods = res.map(food => {
          return {
            id: food.alim_code,
            label: food.alim_nom_fr
          };
        });
        context
          .response()
          .putHeader("content-type", "application/json")
          .end(JSON.stringify(foods));
      } else {
        return context
          .response()
          .setStatusCode(500)
          .end("An error occured when searching foods.");
      }
    });
  });

/**
 * @api {get} /food/:foodId/:aggregate Retrieve food data based on aggregates
 * @apiName GetFoodDatas
 * @apiDescription Retrieves food datas in db then aggregates and return them
 *
 * @apiParam { Number } :foodId Food 'alim_code' in database
 * @apiParam { String } :aggregate Aggregate name
 */
router
  .get()
  .pathRegex("\\/food\\/([0-9]+)\\/([a-z_]+)")
  .produces("application/json")
  .handler(context => {
    if (serviceReady === false) {
      return context
        .response()
        .setStatusCode(503)
        .end("Service is not ready");
    }

    const alim_code = context.request().getParam("param0");
    const aggregate = context.request().getParam("param1");

    if (!Aggregators.hasOwnProperty(aggregate)) {
      return context
        .response()
        .setStatusCode(400)
        .end(`Aggregator ${aggregate} does'nt exists.`);
    }

    const query = { alim_code: parseInt(alim_code) };

    // Performs a regex search on MongoDb
    mongoClient.find("foods", query, (res, err) => {
      if (err == null) {
        const result = Aggregators[aggregate](res[0]);

        context
          .response()
          .putHeader("content-type", "application/json")
          .end(JSON.stringify(result));
      } else {
        return context
          .response()
          .setStatusCode(500)
          .end("An error occured when retrieving food data.");
      }
    });
  });

// Creates and starts HTTP server
const server = vertx.createHttpServer();
server.requestHandler(router.accept).listen(8080);

/**
 * Data loader
 */
const loadDataSource = dataSource => {
  // Cheks config for dataSource
  if (dataSource === undefined) {
    throw Error("Datasource not defined. Please check your conf/config.json");
  }
  // Checks existence of datasource file
  if (!vertx.fileSystem().existsBlocking(dataSource.path)) {
    throw Error("Data file not found.");
  }

  // dataParsers can handle different file formats, depending on the provided data.
  const dataParsers = {
    csv: buff => ParseCsv(buff),
    xml: data => {},
    json: data => {},
    exotic_format: data => {}
  };

  // Opens the file, parses it depending on the format, then inserts datas in MongoDb
  vertx.fileSystem().open(dataSource.path, {}, (fileHandler, result_err) => {
    if (result_err == null) {
      fileHandler.setReadBufferSize(150000);
      const buff = Buffer.buffer();

      fileHandler.endHandler(fh => {
        console.log(`File read, now parsing it with type: ${dataSource.type}`);
        vertx.executeBlocking(
          future => {
            // Call the parser related to the source type, and retrieve the data as an array
            const data = dataParsers[dataSource.type](buff);
            future.complete(data);
          },
          (res, err) => {
            vertx.executeBlocking(
              futureDb => {
                res.forEach(item => mongoClient.save("foods", item, () => {}));
                futureDb.complete();
              },
              (resDb, errDb) => {
                console.log("MongoDb insert ok, server is ready");
                serviceReady = true;
              }
            );
          }
        );

        // Prepare BulkOperation for MongoDb bulkWrite
        //  ==> For some reason, bulkWrite didn't work as expected, so I stay on ugly item by item inserts
        //
        // var io = Packages.io;
        // var BulkOperation = io.vertx.ext.mongo.BulkOperation;
        // var JsonObject = io.vertx.core.json.JsonObject;
        // const bulkOp = data.map(item => {
        //   return BulkOperation.createInsert(new JsonObject(JSON.stringify(item)));
        // });
        // mongoClient.bulkWrite('foods', bulkOp, (res) => {
        //   console.log(res);
        // })
      });

      // Append data to the buffer on each chunk read
      fileHandler.handler((data, err) =>
        buff.appendBuffer(data)
      );
    } else {
      console.error("Cannot open file ", result_err);
    }
  });
};

// First empty the 'foods' collection, then import the new data source
mongoClient.removeDocuments("foods", {}, function(res, err) {
  if (err == null) {
    loadDataSource(config.dataSource);
  } else {
    err.printStackTrace();
  }
});
