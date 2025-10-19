const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  caption: { 
    type: String, 
    default: '' 
  },
  imageUrl: { 
    type: String, 
    default: '' 
  },
  tags: [{ 
    type: String, 
    lowercase: true, 
    trim: true 
  }],  // ⭐ ADD THIS!
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Post', postSchema);
