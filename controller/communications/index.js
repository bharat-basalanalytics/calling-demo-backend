const { AsyncWrapper } = require('@/utils')

const main = AsyncWrapper({})

module.exports = {
  ...main,
  vapi: require('./vapi')
}
