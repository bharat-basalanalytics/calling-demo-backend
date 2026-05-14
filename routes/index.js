const router = require('express').Router()

router.get('/', (req, res) => res.status(200).json({ v: '0.0.1' }))

router.get('/health', (req, res) => { res.status(200).json({}) })

router.use('/api/v1', require('./api'))

module.exports = router
