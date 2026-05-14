const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const CommunicationVapiAssistantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  vapiCreatedAt: { type: Date, required: true },
  vapiUpdatedAt: { type: Date, required: true },
  artifactPlan: { type: Object },
  toolIds: [{ type: String }],
  variables: { type: Object, default: {} },
  calls: [{ type: ObjectId, ref: 'communications-vapi-calls' }]
}, { timestamps: true })

module.exports = mongoose.model('communications-vapi-assistant', CommunicationVapiAssistantSchema)
