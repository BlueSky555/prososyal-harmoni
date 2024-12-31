import * as PH from "./server.js";

PH.serializeDB();

PH.serve();

setInterval(PH.systemPeriodic, 2000);