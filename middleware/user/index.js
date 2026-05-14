const { AppError, AsyncWrapper } = require('@/utils')
const jwt = require('jsonwebtoken')

const protect = async (req, res, next) => {
  const key = process.env.USER_KEY_COOKIE || 'user_session_token'
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else {
    token = req.cookies[key]
  }

  if (!token) return next(new AppError('Unauthorized', 401))

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    res.locals.user = decoded
    next()
  } catch {
    return next(new AppError('Invalid or expired token', 401))
  }
}

module.exports = AsyncWrapper({ protect })
