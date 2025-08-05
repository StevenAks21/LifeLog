const express = require(`express`)

const app = express.Router()


app.get(`/hey`, (req, res) => {
    res.status(200).json({hi:`hei`})
})


module.exports = app