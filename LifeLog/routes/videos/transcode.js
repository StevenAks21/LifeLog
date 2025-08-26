const express = require(`express`)
const router = express.Router()
const path = require(`path`)
const { spawn } = require(`child_process`)
const requireAuth = require(`../../middleware/requireAuth`)
const { pool } = require(`../../db/pool`)
const uploadPath = path.join(__dirname, `../../uploads`)


function runCommand(command, args) {
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();
}

router.post(`/transcode/:id`, requireAuth, async (req, res) => {
    const userId = req.userid
    const videoId = req.params.id
    const [selectQueryResults] = await pool.execute(`SELECT * FROM videos WHERE user_id = ? AND id = ?`, [userId, videoId])
    if (selectQueryResults.length == 0) {
        return res.status(404).json({ error: true, message: `Video with id ${videoId} was not found to be associated with user id ${userId}` })
    }

    const storedName = selectQueryResults[0].stored_name
    const storedPath = path.join(uploadPath, storedName)

    const baseName = path.basename(storedName, path.extname(storedName))
    const newName = `${baseName}-transcoded` + path.extname(storedName)
    const newPath = path.join(uploadPath, newName)



    try {
        runCommand('ffmpeg', [
            '-hide_banner', '-y',
            '-i', storedPath,
            `-vf`, `scale=1280:720`,
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            `-threads`, `2`,
            newPath
        ]);

        const [insertQueryResult] = await pool.execute(
            `INSERT INTO videos (user_id, original_name, stored_name, size_bytes)
   VALUES (?, ?, ?, ?)`,
            [userId, selectQueryResults[0].original_name, newName, selectQueryResults[0].size_bytes]
        );


        const newVideoId = insertQueryResult.insertId;

        const thumbName = `${baseName}-thumb.jpg`
        const thumbPath = path.join(uploadPath, thumbName)

        runCommand('ffmpeg', [
            '-i', storedPath,
            '-ss', '00:00:01.000',
            '-vframes', '1',
            thumbPath
        ])

        await pool.execute(
            `INSERT INTO thumbnails (video_id, path) VALUES (?, ?)`,
            [newVideoId, thumbName]
        );

        return res.status(200).json({ error: false, message: `Transcode started`, outputName: newName })
    }

    catch (e) {
        return res.status(500).json({ error: true, message: `error transcoding ${e.message}` })
    }

})


module.exports = router