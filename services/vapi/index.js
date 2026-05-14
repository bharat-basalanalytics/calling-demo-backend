const axios = require('axios')
const { AppError } = require('@/utils')

const VAPI_BASE_URL = 'https://api.vapi.ai'

const getClient = () => {
  const apiKey = process.env.VAPI_PRIVATE_API_KEY
  if (!apiKey) {
    throw new Error('VAPI_PRIVATE_API_KEY is not configured')
  }
  return axios.create({
    baseURL: VAPI_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })
}

const checkAssistant = async (assistantId) => {
  if (!assistantId || typeof assistantId !== 'string') {
    throw new AppError('Assistant ID is required', 400)
  }
  try {
    const client = getClient()
    const { data } = await client.get(`/assistant/${assistantId}`)
    return data
  } catch (error) {
    if (error.response?.status === 404) {
      throw new AppError('Assistant not found', 404)
    }
    throw error
  }
}

const getPhoneNumbers = async (params = {}) => {
  try {
    const client = getClient()
    const { data } = await client.get('/v2/phone-number', { params })
    return data
  } catch (error) {
    if (error.response?.data) {
      throw new AppError(error.response.data.message || 'Failed to fetch phone numbers', error.response.status || 500)
    }
    throw error
  }
}

const call = async ({ assistantId, phoneNumberId, customerNumber, variables }) => {
  if (!assistantId || typeof assistantId !== 'string') {
    throw new AppError('Assistant ID is required', 400)
  }
  if (!phoneNumberId || typeof phoneNumberId !== 'string') {
    throw new AppError('Phone number ID is required', 400)
  }
  if (!customerNumber || typeof customerNumber !== 'string') {
    throw new AppError('Customer number is required', 400)
  }

  const payload = {
    assistantId,
    phoneNumberId,
    customer: { number: customerNumber.trim() }
  }

  if (variables && typeof variables === 'object' && !Array.isArray(variables) && Object.keys(variables).length > 0) {
    payload.assistantOverrides = { variableValues: variables }
  }

  try {
    const client = getClient()
    const { data } = await client.post('/call', payload)
    return data
  } catch (error) {
    if (error.response?.status === 404) {
      throw new AppError('Assistant or phone number not found', 404)
    }
    if (error.response?.data) {
      throw new AppError(error.response.data.message || 'Failed to initiate call', error.response.status || 500)
    }
    throw error
  }
}

module.exports = {
  checkAssistant,
  getClient,
  getPhoneNumbers,
  call
}
