const express = require(`express`)
const requireAuth = require(`../../middleware/requireAuth`)
const path = require(`path`)
const multer = require(`multer`)
const fs = require(`fs`)
const router = express.Router()
const { pool } = require(`../../db/pool`)

// Create upload path pathname
const uploadPath = path.join(__dirname, `../..`, `uploads`)


// Check if path exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true })
}
// Sets up storage with uploadPath as path to store video and a unique suffix
const storage = multer.diskStorage({
    destination: uploadPath, filename: function (req, file, cb) {
        const extension = path.extname(file.originalname) || ``
        const fileName = file.originalname
        const timeNow = new Date(Date.now()).toISOString()
        const videoName = req.userid + `-` + fileName + `_` + timeNow
        cb(null, videoName + extension)
    }
})

// Sets up upload
const upload = multer({
    storage: storage, fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith(`video/`)) {
            return cb(new Error('only video is allowed to be uploaded!'))
        }
        else {
            cb(null, true)
        }
    }
})

router.post(`/upload`, requireAuth, upload.any(), async (req, res) => {
    if (!req.files) {
        return res.status(400).json({ error: true, message: `no file was uploaded` })
    }
    else {
        const [rows] = await pool.query(`SELECT 1+1 AS result`);
        console.log(`query result is ${rows[0].result}`)
        return res.status(200).json({
            error: false, message: `successfully uploaded`
        })
    }
})

module.exports = router