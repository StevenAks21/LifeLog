const express = require(`express`)
const app = express.Router()
const path = require(`path`)
const fs = require(`fs/promises`)
const requireAuth = require(`../../middleware/requireAuth`)
const { pool } = require(`../../db/pool`)
const video = require("ffmpeg/lib/video")
const { timeStamp } = require("console")
const dir = path.join(__dirname, `../../uploads`)


app.get(`/`, requireAuth, async (req, res) => {
    const userId = req.userid
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const sort = req.query.sort || 'id'
    const order = (req.query.order || 'DESC').toUpperCase()
    const offset = (page - 1) * limit

    const [results] = await pool.execute(
        `SELECT * FROM videos 
     WHERE user_id = ? 
     ORDER BY ${sort} ${order} 
     LIMIT ${limit} OFFSET ${offset}`,
        [userId]
    )

    const [[{ count }]] = await pool.execute(
        `SELECT COUNT(*) AS count FROM videos WHERE user_id = ?`,
        [userId]
    )

    return res.status(200).json({
        error: false,
        page,
        limit,
        total: count,
        pageCount: Math.ceil(count / limit),
        pageSize: results.length,
        sort,
        order,
        results,
    })
})

app.get(`/getdescription/:id`, requireAuth, async (req, res) => {
    const userId = req.userid
    const videoId = req.params.id

    const [result] = await pool.execute(`SELECT * FROM videos WHERE user_id = ? AND id = ?`, [userId, videoId])


    if (result.length == 0) {
        return res.status(404).json({ error: true, message: `Video with id ${videoId} was not found or is not associated with user id ${userId}` })
    }

    const title = result[0].original_name
    console.log(title)
    console.log(process.env.GEMINI_API_KEY)
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Write a description for this video title: "${title}". If the title is unclear, say that it is unclear. make it 2 paragraphs long`
                            }
                        ]
                    }
                ]
            })
        }
    )

    const data = await response.json()
    const description = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No description generated'

    const jsonFile = {
        userId,
        videoId,
        title,
        description,
        timeStamp: new Date().toISOString()
    }

    const filePath = path.join(dir, `${videoId}-description.json`)
    await fs.writeFile(filePath, JSON.stringify(jsonFile, null, 2))

    return res.status(200).json({
        error: false,
        message: 'Description generated successfully',
        description,
        jsonFile
    })
})

app.delete(`/delete/all`, requireAuth, async (req, res) => {
    const userId = req.userid
    const [result] = await pool.execute(`SELECT * FROM videos WHERE user_id = ? `, [userId])
    const resultLength = result.length

    if (resultLength == 0) {
        return res.status(404).json({ error: true, message: `no video was found associated with user id ${userId}` })
    }

    const [deleteQueryResult] = await pool.execute(`DELETE FROM videos WHERE user_id = ?`, [userId])

    const affectedRows = deleteQueryResult.affectedRows

    for (let i = 0; i < resultLength; i++) {
        fs.unlink(path.join(dir, result[i].stored_name))
    }


    return res.status(200).json({ error: false, message: `successfully deleted ${affectedRows} videos associated with user id ${userId}` })
})

app.delete(`/delete/:id`, requireAuth, async (req, res) => {
    const userId = req.userid
    const videoId = req.params.id

    const [selectResult] = await pool.execute(`SELECT * FROM videos WHERE id = ? AND user_id = ?`, [videoId, userId])

    if (selectResult.length == 0) {
        return res.status(404).json({ error: true, message: `Video with ${videoId} was not found or is not associated with user id ${userId}` })
    }
    const storedName = selectResult[0].stored_name

    const filePath = path.join(dir, storedName)

    await fs.unlink(filePath)

    const [result] = await pool.execute(`DELETE FROM videos WHERE id = ? AND user_id = ? `, [videoId, userId])
    const affectedRows = result.affectedRows

    if (affectedRows == 0) {
        return res.status(404).json({ error: true, message: `Video not found or video does not belong to user with id ${userId}` })
    }

    return res.status(200).json({ error: false, message: `successfully deleted video with video id ${videoId}` })
})

app.put('/rename/:id', requireAuth, async (req, res) => {
    const userId = req.userid
    const videoId = req.params.id
    const newName = req.body.newName
    if (!newName) {
        return res.status(400).json({ error: true, message: `a newName field is required` })
    }

    const [queryResult] = await pool.execute(`SELECT stored_name FROM videos WHERE id = ? and user_id = ?`, [videoId, userId])

    if (queryResult.length === 0) {
        return res.status(404).json({ error: true, message: `cannot find video with id ${videoId} or video is not associated with user id ${userId}` })
    }

    const oldName = queryResult[0].stored_name
    const oldPath = path.join(dir, oldName)
    const extension = path.extname(oldName)

    const newPath = path.join(dir, newName) + extension

    fs.rename(oldPath, newPath)

    await pool.execute("UPDATE videos SET stored_name = ? WHERE id = ? AND user_id = ?", [newName + extension, videoId, userId])

    return res.status(200).json({ error: false, message: `successfully renamed ${oldName} to ${newName}` })
})




module.exports = app