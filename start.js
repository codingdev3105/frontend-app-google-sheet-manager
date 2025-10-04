// start.js
const serve = require("serve");
const port = process.env.PORT || 5000; // Render fournit PORT
serve("build", { port });
