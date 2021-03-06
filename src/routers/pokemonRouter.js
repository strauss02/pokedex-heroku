const { response } = require('express')
const Pokedex = require('pokedex-promise-v2')
const P = new Pokedex()
const fs = require('fs')
const { resolve } = require('path')

const express = require('express')
const router = express.Router()

// let currentPokemon = {
//   id: 8,
//   name: 'wartortle',
//   height: 10,
//   weight: 225,
//   types: ['water'],
//   front_pic:
//     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png',
//   back_pic:
//     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/8.png',
//   abilities: ['torrent', 'rain-dish'],
// }

//get pokemon by ID
router.get('/get/:id', (req, res, next) => {
  console.log('we got id param')
  console.log(req.params.id)
  console.log(req.header('username'))
  P.getPokemonByName(req.params.id)
    .then((pokeres) => {
      const pokeObject = getPokemonObj(pokeres)
      res.send(pokeObject)
    })
    .catch((err) => {
      next({ status: 404, message: { error: 'no such pokemon' } })
      // res.send(err.message)
      return
    })
})

function requestPokemonObject(id) {
  return new Promise((resolve, reject) => {
    resolve(
      P.getPokemonByName(id)
        .then((pokeres) => {
          const pokeObject = getPokemonObj(pokeres)
          return pokeObject
        })
        .catch((err) => {
          err.message
        })
    )
  })
}
// // Local host:8080/Pokemon/query?name=pikachu

//get pokemon by name
router.get('/query', (req, res, next) => {
  console.log('we got pokemon name param')
  console.log(req.query.name)
  P.getPokemonByName(req.query.name)
    .then((pokeres) => {
      const pokeObject = getPokemonObj(pokeres)
      console.log('this is in get by id', pokeObject)
      res.send(pokeObject)
    })
    .catch((err) => {
      // res.send(err.message)
      next({ status: 404, message: { error: 'no such pokemon' } })
      return
    })
})

//get all caught pokemon!
router.get('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  const user = req.header('username')
  const arr = getAllCaughtPokemon(user)
  res.send(arr)
})

router.get('/list', (req, res) => {
  username = req.header('username')
  let idList = []
  console.log('line 84')
  let userDir = fs.readdirSync(`./src/users/${username}`)
  for (let file of userDir) {
    let parsrFile = JSON.parse(
      fs.readFileSync(`./src/users/${username}/${file}`, 'utf8')
    )
    idList.push(parsrFile.name)
  }
  res.send(idList)
})

function getAllCaughtPokemon(user) {
  const fileList = fs.readdirSync(`./src/users/${user}/`)
  const arr = []
  fileList.forEach((pokemonFile) => {
    const file = fs.readFileSync(`./src/users/${user}/${pokemonFile}`)
    const pokemonID = JSON.parse(file).id
    arr.push(pokemonID)
  })
  return arr
}

function assertPokemonAlreadyCaught(user, id) {
  return fs.existsSync(`./src/users/${user}/${id}.json`)
}

function getPokemonObj(data) {
  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: getPokemonTypes(data),
    front_pic: data.sprites.front_default,
    back_pic: data.sprites.back_default,
    abilities: getAbilities(data.abilities),
  }
}

//delete pokemon from caught list
router.delete('/release/:id', (req, res, next) => {
  //check if pokemon exists in caught li  st
  const user = req.header('username')
  const pokemonID = req.params.id
  if (assertPokemonAlreadyCaught(user, pokemonID)) {
    fs.unlinkSync(`./src/users/${user}/${pokemonID}.json`)
    res.send('pokemon released')
  } else {
    // const err = new Error('no pokemon exists!')
    next({
      status: 403,
      message: { error: 'no such pokemon in your caughtlist!' },
    })
    return
  }
})

//catch pokemon! - grayed cus amit's works better
// router.put('/catch/:id', function (req, res, next) {
//   console.log('we got pokemon put request')
//   console.log(req.params.id)
//   const userName = req.header('username')
//   const pokemonID = req.params.id
//   try {
//     handleCatch(userName, pokemonID, next, res)
//   } catch (error) {
//     next({ message: { error: 'you already caught one!' } })
//     return
//   }
//   // res.send('pokemon caught')
// })

// catch according to amit
router.put('/catch/:id', (req, response, next) => {
  const username = req.header('username')
  const pokemonId = req.params.id
  fs.readdir('./src/users', async (err, res) => {
    console.log('dont let me into ma zone')
    if (err) {
      console.log(err)
      return
    }
    if (!res.includes(username)) {
      //if the username does not exist
      fs.mkdirSync(`./src/users/${username}`)
      fs.writeFileSync(
        `./src/users/${username}/${pokemonId}.json`,
        JSON.stringify(getPokemonObj(await getPokemonData(pokemonId)))
      )
      response.send('Catch!')
    } else if (
      fs.readdirSync(`./src/users/${username}`).includes(`${pokemonId}.json`)
    ) {
      next({
        status: 403,
        message: {
          error:
            'releasing an uncaught pokemon, or catching an already caught pokemon',
        },
      })
    } else {
      fs.writeFileSync(
        `./src/users/${username}/${pokemonId}.json`,
        JSON.stringify(getPokemonObj(await getPokemonData(pokemonId)))
      )
      response.send('Catch!')
    }
  })
})

//from amit
async function getPokemonData(id) {
  let data = await P.getPokemonByName(id)
  return data
}

//check user exists, if not, create it's folder
function handleCatch(user, id, next, putRes) {
  console.log('handlecatch id', id)
  fs.readdir('./src/users', (err, res) => {
    if (err) {
      console.log(err)
      return
    }
    if (!res.includes(user)) {
      console.log('no user exists. creating new user folder')
      fs.mkdirSync(`./src/users/${user}`)
    }
    createPokemonJson(id, user, next, putRes)
  })
}

//creates a pokemon.json file in the user's folder
async function createPokemonJson(id, user, next, putRes) {
  fs.readdir(`./src/users/${user}`, async (err, res) => {
    if (err) {
      console.log(err)
    } else {
      console.log('id in createpokemonjson', id)
      // const pokeObject = requestPokemonObject(id)
      // console.log('pokeObject is:', pokeObject)
      // try {
      if (res.includes(`${id}.json`)) {
        console.log('pokemon already exists')
        console.log('we got here')
        await next({
          status: 403,
          message: { error: 'you already caught one! line 181' },
        })
        return
        // throw Error('pokemon already caught. you cant catch twice')
      } else {
        console.log('no pokemon found')
        const object = await requestPokemonObject(id).then((res) => res)
        console.log(object)
        fs.writeFileSync(`users/${user}/${id}.json`, JSON.stringify(object))
        putRes.send('pokemon caught!')
        console.log('we got to 172')
        // }
        // } catch (error) {
        // }
      }
    }
  })
}

const getPokemonTypes = (data) => {
  let typesArr = []
  for (let type of data.types) {
    typesArr.push(`${type.type.name}`)
  }
  return typesArr
}

const getAbilities = (abilities) => {
  const array = []
  abilities.forEach((ability) => {
    array.push(ability.ability.name)
  })
  return array
}

module.exports = router
