function errorHandlerPokemon(err, req, res, next) {
  console.log('we have entered error Handler zone')
  console.log('here is the suspect: ', err)
  if (!err.status) {
    res.status = 500
    res.send(err)
  }
  //   console.log(err)
  //   console.log('res is:', res)
  res.status(err.status)
  console.log(err.message)
  res.send(err.message)
}

module.exports = errorHandlerPokemon
