import { Hono } from "hono";
import v1 from "./v1";
import auth from "./v1/auth";
 
const api = new Hono();
 
// Better-Auth routes (must be mounted before v1)
api.route("/auth", auth);
 
// API Versioning
api.route("/v1", v1);

// Version info endpoint
api.get("/", (c) =>
  c.json({
    versions: ["v1"],
    current: "v1",
    deprecated: [],
  })
);

export default api;

