const { createBullBoard } = require('@bull-board/api')
// const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [],
  serverAdapter
})

const getRouter = () => serverAdapter.getRouter()

module.exports = { getRouter }
