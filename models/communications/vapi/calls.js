const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const CommunicationVapiCallsSchema = new mongoose.Schema({
  assistant: { type: ObjectId, ref: 'communications-vapi-assistant' },
  variables: { type: Object },
  candidate: { type: ObjectId, ref: 'candidates' },
  posted: { type: ObjectId, ref: 'posted-jobs' },
  id: { type: String, trim: true, unique: true },
  phoneNumberId: { type: String, trim: true },
  fromPhone: { type: String, trim: true },
  vapiCreatedAt: { type: Date, required: true },
  vapiUpdatedAt: { type: Date, required: true },
  status: { type: String },
  error: { type: mongoose.Schema.Types.Mixed },
  endedReason: { type: String },
  transcript: { type: String },
  disposition: {
    name: { type: String },
    value: { type: Boolean }
  },
  summary: { type: String },
  messages: [{ type: Object }],
  recordingUrl: { type: String },
  duration: { type: Number },
  cost: {
    breakdown: { type: Object },
    details: { type: Object },
    total: { type: Number }
  }
}, { timestamps: true })

module.exports = mongoose.model('communications-vapi-calls', CommunicationVapiCallsSchema)
