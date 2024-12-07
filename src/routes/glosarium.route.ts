import { Router } from "express";
import {
  getGlosariumMeaning,
  getGlosariumWithPagination,
  searchGlosariumMeaning,
} from "../controllers/glosarium.controller";
import path from "path";

const router = Router();

router.get("/", async (req, res) => {
  let page = 1;
  if (req.query.page) {
    page = parseInt(req.query.page as string);
  }

  let wordFilter;
  if (req.query.word) {
    wordFilter = req.query.word as string;
  }

  let withMeaning = false;
  if (req.query["with-meaning"] === "1") {
    withMeaning = true;
  }

  const glosariumData = await getGlosariumWithPagination(
    page,
    wordFilter,
    withMeaning
  );
  res.json(glosariumData);
});

router.get("/meaning", async (req, res) => {
  if (!req.query.id) {
    res.json({ glosarium: [] });
    return;
  }

  const ids = (req.query.id as string).split(",").map((item) => parseInt(item));
  const glosarium = await getGlosariumMeaning(ids);

  res.json(glosarium);
});

router.get("/search-meaning", async (req, res) => {
  let page = 1;
  if (req.query.page) {
    page = parseInt(req.query.page as string);
  }

  let wordFilter;
  if (req.query.word) {
    wordFilter = req.query.word as string;
  }

  const glosariumData = wordFilter
    ? await searchGlosariumMeaning(page, wordFilter)
    : await getGlosariumWithPagination(page, wordFilter, true);
  res.json(glosariumData);
});

router.get("/app", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "glosarium_app", "index.html")
  );
});

export const glosariumRouter = router;
