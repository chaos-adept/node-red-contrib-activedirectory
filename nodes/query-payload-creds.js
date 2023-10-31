const ActiveDirectory = require('activedirectory2')
module.exports = function (RED) {
  'use strict'

  const ActiveDirectory = require('activedirectory2')

  function queryNode (config) {
    RED.nodes.createNode(this, config)
    const node = this
    let url
    let cUsername
    let cPassword

    node.on('input', function (msg) {
      node.status({ fill: 'blue', shape: 'ring', text: 'connecting' })

      const configFromPayload = JSON.parse(JSON.stringify(msg.ad_config))
      node.url = configFromPayload.url
      node.baseDN = config.baseDN

      cUsername = configFromPayload.credentials.username
      cPassword = configFromPayload.credentials.password

      const adConfig = {
        url: node.url,
        baseDN: node.baseDN,
        tlsOptions: node.tlsOptions,
        username: cUsername,
        password: cPassword
      }
      // set attributes if defined
      if (msg.ad_attributes) {
        // Validates the Object format (required for IBMi platform)
        adConfig.attributes = JSON.parse(JSON.stringify(msg.ad_attributes))
      }
      if (msg.tlsOptions) {
        // Validates the Object format (required for IBMi platform)
        adConfig.tlsOptions = JSON.parse(JSON.stringify(msg.tlsOptions))
      }
      try {
        const ad = new ActiveDirectory(adConfig)
        node.status({ fill: 'green', shape: 'dot', text: 'connected' })
        const query = msg.payload
        // const opts = {
        //  includeMembership: ['group', 'user'], // Optionally can use 'all'
        //  includeDeleted: false
        // }
        node.status({ fill: 'blue', shape: 'ring', text: 'querying' })
        ad.find(query, function (err, results) {
          if (err) {
            node.status({ fill: 'red', shape: 'dot', text: 'error querying' })
            node.error('ERROR querying: ' + JSON.stringify(err), msg)
          } else {
            msg.payload = results
            node.status({ fill: 'green', shape: 'dot', text: 'query successful' })
            node.send(msg)
          }
        })
      } catch (e) {
        node.status({ fill: 'red', shape: 'dot', text: 'connection error' })
        node.error('ERROR connecting: ' + e.message, msg)
      }
    })
  }

  RED.nodes.registerType('query-payload-creds', queryNode)
}
