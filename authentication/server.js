import configuri from "./src/config/configuri.js";
import app from "./src/app/app.js";
import { dbconnection } from "./src/config/db.js";

await dbconnection();

app.listen(configuri.PORT, () => {
  console.log(`This server is running on port ${configuri.PORT}`);
});
