const jsonwebtoken = require(`jsonwebtoken`)
const express = require(`express`)

const router = express.Router()

router.use(express.json())

const users = [
    { id: 1, username: `steven`, password: `123` },
    { id: 2, username: `alex`, password: `123` }
]

function signToken(payLoad) {
    return jsonwebtoken.sign(payLoad, process.env.JWT_SECRET, { expiresIn: `1h` })
}


router.post(`/`, (req, res) => {
    const username = req.body.username
    const password = req.body.password

    if (!username || !password) {
        return res.status(400).json({ error: true, message: `username or password cannot be empty!` })
    }

    const user = users.find(u => 
        u.username === username
    )

    if(!user){
        return res.status(401).json({error: true, message: `invalid credentials`})
    }

    if(user.password !== password){
        return res.status(401).json({error: true, message : `invalid credentials`})
    }

    const token = signToken(user)
    return res.status(200).json({error: false, token : token, expiresIn : `3600`})
})





module.exports = router
