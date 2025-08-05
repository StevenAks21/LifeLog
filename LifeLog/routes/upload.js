const express = require(`express`)
const requireAuth = require(`../middleware/requireAuth`)
const path = require(`path`)
const multer = require(`multer`)
const { v4: uuid } = require(`uuid`)
const fs = require(`fs`)


const uploadPath = path.join(__dirname, `..`, `uploads`)

if(!fs.existsSync(uploadPath)){
    fs.mkdirSync(uploadPath, {recursive: true})
}





const router = express.Router()