const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//functions #####################################################

let forstates = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

let forsinglestate = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

let fordistricts = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};
//API##################################################

app.get("/states/", async (request, response) => {
  let queiry = `SELECT * FROM state`;

  let stats = await database.all(queiry);

  response.send(stats.map((eachstate) => forstates(eachstate)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuery = `
    SELECT 
      * 
    FROM 
      state
    WHERE 
      state_id = ${stateId};`;
  const player = await database.get(getstateQuery);
  response.send(forsinglestate(player));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postPlayerQuery = `
  INSERT INTO
    district (district_name, state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases},${cured},${active},${deaths});`;
  const player = await database.run(postPlayerQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      district 
    WHERE 
      district_id = ${districtId};`;
  const player = await database.get(getPlayerQuery);
  response.send(fordistricts(player));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletePlayerQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deletePlayerQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updatePlayerQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};`;

  await database.run(updatePlayerQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;

  let queiry = `SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths) FROM district WHERE state_id = ${stateId}`;

  let stats = await database.get(queiry);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let queiry = `SELECT state_id FROM district WHERE district_id = ${districtId}`;

  let result = await database.get(queiry);

  let statename = `SELECT state_name as stateName FROM state WHERE state_id = ${result.state_id}`;

  let resultname = await database.get(statename);

  response.send(resultname);
});

module.exports = app;
