const express = require('express')
const app = new express()

const cors = require('cors')
const path = require('path')

const userRouter = require('./routers/userRouter')
const userHandler = require('./src/middleware/userHandler')
const pokemonRouter = require('./routers/pokemonRouter')
const errorHandler = require('./src/middleware/errorHandler')
const Pokedex = require('pokedex-promise-v2')
const P = new Pokedex()

app.use(cors()) // cors middleware

app.use('/', express.static(path.resolve('./dist'))) // serve main path as static dir
app.get('/', function (req, res) {
  // serve main path as static file
  res.sendFile(path.resolve('./dist/index.html'))
})

app.use('/pokemon', userHandler, pokemonRouter)
app.use('/info', userRouter)
app.use(errorHandler)

app.listen(process.env.PORT || 8080, () => console.log('Server is running...'))
