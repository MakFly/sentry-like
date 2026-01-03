import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { apiKeyMiddleware } from "../../middleware/api-key";
import { asHandler } from "../helpers";
import * as SourcemapController from "../../controllers/v1/SourcemapController";

const router = new Hono();

router.post("/upload", apiKeyMiddleware, SourcemapController.upload);
router.get("/", auth(), asHandler(SourcemapController.list));
router.delete("/:id", auth(), asHandler(SourcemapController.remove));
router.post("/deobfuscate", auth(), asHandler(SourcemapController.deobfuscate));

export default router;

