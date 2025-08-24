const express = require(`express`)
const app = express.Router()
const path = require(`path`)
const fs = require(`fs/promises`)
const requireAuth = require(`../../middleware/requireAuth`)
const { pool } = require (`../../db/pool`)



app.get(`/transcode/:id`, requireAuth, async (req, res) => {
    res.status(200).json({error: `hello from transcode`})
})


module.exports = app