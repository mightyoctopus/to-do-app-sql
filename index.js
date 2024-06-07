require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const logger = require('./logger');


const app = express();
const port = process.env.PORT || 8080;

const db = new pg.Client({
    user: 'mhhoymjo_postgres',   
    host: 'localhost',       
    database: 'mhhoymjo_todo-app-sql',        
    password: process.env.DB_PASSWORD,  
    port: 5432,  
})
db.connect()
 .then(() => logger.info("PostgreSQL connected"))
 .catch(err => { logger.error("Connetion error:", err.stack)
 process.exit(1);
 });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
const basePath = '/todo-app-sql';
app.use(basePath, express.static("public"));

let items = [
  { id: 1, title: "Buy milk" },
  { id: 2, title: "Finish homework" },
];

app.get(`${basePath}/`, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC");
    items = result.rows;

    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
      basePath: basePath,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading data")
  }
});


app.post(`${basePath}/add`, async (req, res) => {
  const item = req.body.newItem;
  // items.push({title: item});
  logger.info('Inserted input values:', item);
  try {
    const result = await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
    logger.info("Inserted data (Result):", result);
    res.redirect(`${basePath}/`);
  } catch (err) {
    logger.error("Error inserting data:",err);
    res.status(500).send("Error posting data");
  }
});


app.post(`${basePath}/edit`, async (req, res) => {
  const item = req.body.updatedItemTitle;  
  const id = req.body.updatedItemId;

  console.log("id:", id, "item:", item);

  try {
    await db.query("UPDATE items SET title = ($1) WHERE id = $2", [item, id]);
    res.redirect(`${basePath}/`);
  } catch (err) {
    console.log(err);
  }
});

app.post(`${basePath}/delete`, async (req, res) => {
  const id = req.body.deleteItemId;
  try {
    await db.query("DELETE FROM items WHERE id = $1", [id]);
    res.redirect(`${basePath}/`);
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
