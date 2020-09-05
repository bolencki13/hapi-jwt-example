const Hapi = require('@hapi/hapi')
const Jwt = require('@hapi/jwt')
const jsonwebtoken = require('jsonwebtoken')
const axios = require('axios')
const jwtSecret = 'secret'

const main = async () => {
  const server = new Hapi.Server({
    host: 'localhost',
    port: 8000
  })

  await server.register(Jwt)

  const validateJWT = () => {
    return {
      isValid: true,
      credentials: {
        user: {
          id: 1
        }
      },
      response: 'User authenticated successfully.',
    }
  }

  server.auth.strategy('jwt', 'jwt', {
    keys: jwtSecret,
    verify: {
      // audience of the jwt
      aud: 'my:aud',
      // issuer of the jwt
      iss: 'my:iss',
      // verify subject of jwt
      sub: 'my:auth'
    },
    validate: validateJWT
  })

  const securedRoute = {
    method: 'get',
    path: '/secured',
    handler: () => {
      console.log('User successfully authenticated.')
      throw new Error('An error occured')
      return {
        result: 'secured route success'
      }
    },
    options: {
      auth: 'jwt'
    }
  }
  const unsecuredRoute = {
    method: 'get',
    path: '/',
    handler: () => {
      return {
        result: 'unsecured route success'
      }
    }
  }

  server.route([securedRoute, unsecuredRoute])

  await server.start()

  console.log('listening for incoming network requests...')

  const token = jsonwebtoken.sign({
    user: 1,
    sub: 'my:auth',
    aud: 'my:aud',
    iss: 'my:iss',
  }, jwtSecret)

  console.log('Attempting unsecured endpoint')
  console.log('Attempting secured endpoint')
  await Promise.all([
    axios.get('http://localhost:8000/')
      .then(function(response) {
        console.log(response.data)
      })
      .catch((error) => {
        console.error(error)
      }),
    axios.get('http://localhost:8000/secured', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })
      .then(function(response) {
        console.log(response.data)
      })
      .catch((error) => {
        console.error(error)
      })
  ])
  process.exit(0)
}

main()
