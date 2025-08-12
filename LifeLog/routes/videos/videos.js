const express = require(`express`)
const app = express.Router()
const path = require(`path`)
const fs = require(`fs`)
const requireAuth = require(`../../middleware/requireAuth`)

const dir = path.join(__dirname, `../../uploads`)


app.get(`/`, requireAuth, (req, res) => {

    fs.readdir(dir, (err, files) => {
        if (err) {
            return res.status(400).json({ error: true, message: `error searching for videos.` })
        }

        const id = req.userid
        const filenames = files
            .filter(f => !f.startsWith(`.`))
            .filter(f => f.startsWith(`${id}-`))


        return res.status(200).json({ error: false, videoNames: filenames, count: filenames.length })

    })
})




module.exports = app