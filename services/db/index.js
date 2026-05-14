const mongoose = require('mongoose')

let MONGO_URI = process.env.MONGO_URI
console.log({ MONGO_URI: process.env.MONGO_URI })
MONGO_URI = MONGO_URI.replace('<password>', process.env.MONGO_PWD)

const init = () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      if (process.env.NODE_ENV === 'dev') console.log('DB connected')
    })
    .catch((err) => {
      console.error({ err })
      console.error('DB connection error')
    })
}

const create = (Model, data) =>
  new Promise((resolve, reject) => {
    Model.create(data)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const find = (Model, query, options = {}) =>
  new Promise((resolve, reject) => {
    const {
      populate = false,
      select = false,
      sort = false,
      lean = false,
      limit = false,
      skip = false,
      cursor = false
    } = options

    let queryBuilder = Model.find(query)

    if (populate) queryBuilder = queryBuilder.populate(populate)
    if (select) queryBuilder = queryBuilder.select(select)
    if (sort) queryBuilder = queryBuilder.sort(sort)
    if (skip) queryBuilder = queryBuilder.skip(skip)
    if (limit) queryBuilder = queryBuilder.limit(limit)
    if (lean) queryBuilder = queryBuilder.lean()

    if (cursor) {
      resolve(queryBuilder.cursor())
    } else {
      queryBuilder
        .exec()
        .then((response) => resolve(response))
        .catch((error) => reject(error))
    }
  })

const findOne = (Model, query, options = {}) =>
  new Promise((resolve, reject) => {
    const { populate = false, select = false, sort = false, lean = false } = options

    let queryBuilder = Model.findOne(query)

    if (populate) queryBuilder = queryBuilder.populate(populate)
    if (select) queryBuilder = queryBuilder.select(select)
    if (sort) queryBuilder = queryBuilder.sort(sort)
    if (lean) queryBuilder = queryBuilder.lean()

    queryBuilder
      .exec()
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const findOneAndUpdate = (Model, query, data, options = {}) =>
  new Promise((resolve, reject) => {
    const { populate = false, create = false, select = false, lean = false } = options

    let queryBuilder = Model.findOneAndUpdate(query, data, { new: true })

    if (populate) queryBuilder = queryBuilder.populate(populate)
    if (select) queryBuilder = queryBuilder.select(select)
    if (create) queryBuilder = queryBuilder.setOptions({ upsert: true, setDefaultsOnInsert: true })
    if (lean) queryBuilder = queryBuilder.lean()

    queryBuilder
      .exec()
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const aggregate = (Model, query) =>
  new Promise((resolve, reject) => {
    Model.aggregate(query)
      .then((result) => resolve(result))
      .catch((error) => reject(error))
  })

const count = (Model, query = {}) =>
  new Promise((resolve, reject) => {
    Model.countDocuments(query)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const findOneAndDelete = (Model, query = {}) =>
  new Promise((resolve, reject) => {
    Model.findOneAndDelete(query)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const deleteOne = (Model, query = false) =>
  new Promise((resolve, reject) => {
    if (!query) reject(new Error('Invalid query'))
    Model.deleteOne(query)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const deleteMany = (Model, query = false) =>
  new Promise((resolve, reject) => {
    if (!query) reject(new Error('Invalid query'))
    Model.deleteMany(query)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const updateMany = (Model, query, data, options = {}) =>
  new Promise((resolve, reject) => {
    Model.updateMany(query, data, options)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const updateOne = (Model, query, data, options = {}) =>
  new Promise((resolve, reject) => {
    Model.updateOne(query, data, options)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const distinct = (Model, field, query = {}, options = {}) =>
  new Promise((resolve, reject) => {
    const { collation = null } = options

    let distinctQuery = Model.find(query).distinct(field)

    if (collation) distinctQuery = distinctQuery.collation(collation)

    distinctQuery
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const bulkWrite = (Model, operations, options = {}) =>
  new Promise((resolve, reject) => {
    Model.bulkWrite(operations, options)
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const checkValidId = (id) => mongoose.Types.ObjectId.isValid(id)

module.exports = {
  init,
  create,
  find,
  findOne,
  findOneAndUpdate,
  aggregate,
  count,
  checkValidId,
  findOneAndDelete,
  deleteOne,
  deleteMany,
  updateMany,
  updateOne,
  distinct,
  bulkWrite
}
