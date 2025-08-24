const express = require(`express`)
const router = express.Router()
const path = require(`path`)
const fs = require(`fs/promises`)
const { spawn } = require(`child_process`)
const requireAuth = require(`../../middleware/requireAuth`)
const { pool } = require(`../../db/pool`)
const uploadPath = path.join(__dirname, `../../uploads`)



function runCommand(command, args) {
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();
}

router.get(`/transcode/:id`, requireAuth, async (req, res) => {
    const userId = req.userid
    const videoId = req.params.id
    const [selectQueryResults] = await pool.execute(`SELECT * FROM VIDEOS WHERE user_id = ? AND id = ?`, [userId, videoId])
    if (selectQueryResults.length == 0) {
        return res.status(404).json({ error: true, message: `Video with id ${videoId} was not found to be associated with user id ${userId}` })
    }

    const storedName = selectQueryResults[0].stored_name
    const storedPath = path.join(uploadPath, storedName)

    const baseName = path.basename(storedName, path.extname(storedName))
    const newName = `${baseName}-transcoded` + path.extname(storedName)
    const newPath = path.join(uploadPath, newName)

    try {
        await runCommand('ffmpeg', [
            '-hide_banner', '-y',
            '-i', storedPath,
            `-vf`, `scale=2560:1440`,
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            `-threads`, `0`,
            newPath
        ]);

        await pool.execute(
            `INSERT INTO VIDEOS (user_id, original_name, stored_name, size_bytes)
             VALUES (?, ?, ?, ?)`,
            [
                userId,
                selectQueryResults[0].original_name, 
                newName,
                selectQueryResults[0].size_bytes
            ]
        )

        return res.status(200).json({ error: false, message: `Transcode started`, outputName: newName })
    }

    catch (e) {
        return res.status(500).json({ error: true, message: `error transcoding` })
    }

})


module.exports = router