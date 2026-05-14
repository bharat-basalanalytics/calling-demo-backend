const router = require('express').Router()

router.use('/communications', require('./communications'))

module.exports = router
