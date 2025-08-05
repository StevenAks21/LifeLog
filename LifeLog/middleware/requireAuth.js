const jsonwebtoken = require(`jsonwebtoken`)


const requireAuth = (req, res, next) => {
    const auth = req.headers.authorization || ``
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) {
        return res.status(401).json({ error: true, message: `missing token` })
    }


    try {
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET)
        req.username = decoded.username
        req.id = decoded.id
        next()
    }
    catch {
        return res.status(401).json({error: true, message: `invalid or expired token`})
    }

}


module.exports = requireAuth