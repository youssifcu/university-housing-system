const express = require('express')
const cors = require('cors')
const connectDB = require('./src/config/db')
const admin = require('./src/config/firebase')

const app = express()

connectDB()

app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
console.log(`${req.method} request to ${req.url}`)
next()
})

app.use('/api/auth',require('./src/routes/authRoutes'))
app.use('/api/housing',require('./src/routes/housingRoutes'))

app.get('/',(req,res)=>{
res.send('University Housing Server is Running...')
})

const PORT = 5000

app.listen(PORT,()=>{
console.log(`Server is barking on port ${PORT}`)
})