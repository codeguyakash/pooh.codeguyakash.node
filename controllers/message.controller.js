const ApiResponse = require('../utils/ApiResponse');

exports.sendMessage = async (req, res) => {
  try {
    const { message, to } = req.body;

    console.log('💾 Saving message to DB...', message);

    const io = req.app.get('io');
    io.emit('receive_message', { message, to });

    return res
      .status(200)
      .json(new ApiResponse(200, { message, to }, 'Message sent successfully'));
  } catch (error) {
    console.error('Error in sendMessage controller:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};
