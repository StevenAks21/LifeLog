const express = require(`express`)

const app = express.Router()


app.get(`/`, (req, res) => {
    res.status(200).json({hi:`hei from getvideos`})
})


module.exports = app