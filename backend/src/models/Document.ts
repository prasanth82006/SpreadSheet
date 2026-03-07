import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Spreadsheet',
  },
  data: {
    type: Map,
    of: String,
    default: {},
  },
  formatting: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  columnWidths: {
    type: Map,
    of: Number,
    default: {},
  },
  rowHeights: {
    type: Map,
    of: Number,
    default: {},
  },
  columnOrder: {
    type: [Number],
    default: [],
  },
  rowOrder: {
    type: [Number],
    default: [],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);
