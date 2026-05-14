const router = require('express').Router()

const { communications } = require('@/controller')

router.post('/webhook', communications.vapi.webhook)
router.get('/assistants', communications.vapi.assistants)
router.get('/phone-numbers', communications.vapi.phoneNumbers)
router.post('/call/trigger', communications.vapi.triggerCall)
router.get('/calls', communications.vapi.listAllCalls)

module.exports = router
