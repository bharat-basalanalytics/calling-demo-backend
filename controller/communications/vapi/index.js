const { AsyncWrapper, AppError } = require('@/utils')
const { db, vapi } = require('@/services')
const { CommunicationsVapiAssistant, CommunicationsVapiCalls } = require('@/models')

const listAllCalls = async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100)
  const skip = (page - 1) * limit
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const endedReasonRaw = typeof req.query.endedReason === 'string' ? req.query.endedReason.trim() : ''
  const dateParam = typeof req.query.date === 'string' ? req.query.date.trim() : ''

  const query = {}

  if (dateParam) {
    const parts = dateParam.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const from = new Date(parts[0])
      const to = new Date(parts[1])
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999)
        query.createdAt = { $gte: from, $lte: to }
      }
    }
  }

  if (endedReasonRaw === '__none__') {
    query.$or = [
      { endedReason: null },
      { endedReason: '' },
      { endedReason: { $exists: false } }
    ]
  } else if (endedReasonRaw) {
    query.endedReason = endedReasonRaw
  }

  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(esc, 'i')
    const searchOr = [
      { id: re },
      { fromPhone: re },
      { 'variables.CandidatePhone': re },
      { 'variables.candidateName': re }
    ]
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchOr }]
      delete query.$or
    } else {
      query.$or = searchOr
    }
  }

  const total = await db.count(CommunicationsVapiCalls, query)
  const calls = await db.find(CommunicationsVapiCalls, query, {
    populate: [{ path: 'assistant', select: 'name' }],
    select: 'id fromPhone variables status endedReason duration createdAt vapiCreatedAt assistant',
    sort: { createdAt: -1 },
    skip,
    limit,
    lean: true
  })

  const data = calls.map((call) => {
    const variables = call.variables || {}
    return {
      callAt: call.vapiCreatedAt || call.createdAt,
      candidateName: variables.candidateName ?? '—',
      candidatePhone: variables.CandidatePhone ?? call.fromPhone ?? null,
      callId: call.id,
      endedReason: call.endedReason ?? null,
      status: call.status ?? null,
      duration: call.duration ?? null,
      assistantName: call.assistant?.name ?? null
    }
  })

  res.status(200).json({
    status: 'success',
    data,
    count: total,
    page,
    limit,
    hasMore: skip + data.length < total
  })
}

const assistants = async (req, res, next) => {
  const list = await db.find(CommunicationsVapiAssistant, {}, {
    select: { _id: 1, id: 1, name: 1 },
    sort: { name: 1 },
    lean: true
  })
  res.status(200).json({ status: 'success', data: list })
}

const phoneNumbers = async (req, res, next) => {
  const limit = 100
  let page = 1
  const all = []
  let results
  do {
    const payload = await vapi.getPhoneNumbers({ page, limit })
    results = payload.results ?? []
    all.push(...results)
    page++
  } while (results.length >= limit)
  res.status(200).json({ status: 'success', data: all })
}

const triggerCall = async ({ body }, res, next) => {
  const { phoneNumberId: phoneNumberIdRaw, outboundPhone, assistant, variables } = body

  if (!assistant) return next(new AppError('Assistant is required', 400))

  const varsIn = variables && typeof variables === 'object' ? { ...variables } : {}
  if (!varsIn.CandidatePhone) return next(new AppError('CandidatePhone is required in variables', 400))

  let phoneNumberId = phoneNumberIdRaw

  // If only a phone number string was provided, resolve its VAPI ID
  if (!phoneNumberId && outboundPhone) {
    const payload = await vapi.getPhoneNumbers({ page: 1, limit: 100 })
    const results = payload.results ?? []
    const match = results.find((p) => p.number === outboundPhone)
    if (!match) return next(new AppError(`Phone number ${outboundPhone} not found in VAPI`, 404))
    phoneNumberId = match.id
  }

  if (!phoneNumberId) return next(new AppError('Phone number ID is required', 400))

  const _assistant = await db.findOne(
    CommunicationsVapiAssistant,
    { _id: assistant },
    { select: { _id: 1, id: 1 }, lean: true }
  )
  if (!_assistant) return next(new AppError('Assistant not found', 404))

  const vapiCall = await vapi.call({
    assistantId: _assistant.id,
    phoneNumberId,
    customerNumber: varsIn.CandidatePhone,
    variables: varsIn
  })

  const call = await db.create(CommunicationsVapiCalls, {
    id: vapiCall?.id ?? `call-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    assistant,
    variables: varsIn,
    phoneNumberId,
    vapiCreatedAt: new Date(vapiCall.createdAt),
    vapiUpdatedAt: new Date(vapiCall.updatedAt),
    vapiStatus: vapiCall.status
  })

  res.status(200).json({ status: 'success', data: call })
}

const webhook = async (req, res, next) => {
  const body = req.body || {}
  const message = body.message || body
  const type = body.type ?? message.type
  const call = body.call ?? message.call

  if (!type) {
    return res.status(400).json({ error: 'Invalid webhook payload: missing type' })
  }

  console.log(`Webhook received: ${type}`)

  const callId = call?.id

  const updateCallRecord = async (update) => {
    if (!callId) return null
    return db.findOneAndUpdate(
      CommunicationsVapiCalls,
      { id: callId },
      { ...update, vapiUpdatedAt: call?.updatedAt ? new Date(call.updatedAt) : new Date() }
    )
  }

  switch (type) {
    case 'call-started':
      await updateCallRecord({ status: 'in-progress' })
      break

    case 'status-update':
      await updateCallRecord({ status: body.status ?? message.status })
      break

    case 'end-of-call-report': {
      const artifact = message.artifact || {}
      const update = {
        status: body.status ?? message.status,
        endedReason: message.endedReason,
        cost: {
          total: message.cost ?? null,
          breakdown: message.costBreakdown ?? {},
          details: message.costs ?? {}
        },
        duration: message.durationSeconds,
        summary: message?.analysis?.summary || '',
        messages: artifact.messages || [],
        ...(typeof artifact.transcript === 'string' && { transcript: artifact.transcript }),
        ...(artifact.recordingUrl && { recordingUrl: artifact.recordingUrl })
      }
      await updateCallRecord(update)
      break
    }

    default:
      console.log(`[Vapi webhook] Unhandled type: ${type}`)
  }

  res.status(200).send()
}

module.exports = AsyncWrapper({
  assistants,
  phoneNumbers,
  triggerCall,
  listAllCalls,
  webhook
})
