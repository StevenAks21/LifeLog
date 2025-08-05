const express = require(`express`)
const requireAuth = require(`../middleware/requireAuth`)
const path = require(`path`)
const multer = require(`multer`)
const {v4 : uuid} = require(`uuid`)
const fs = require(`fs`)


const router = express.Router()