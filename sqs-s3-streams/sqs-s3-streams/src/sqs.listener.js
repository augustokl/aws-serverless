class Handler {
  async main(event) {
    try {
      return {
        statusCode: 200,
        body: 'Hello World'
      }
    } catch (error) {
      console.log('**error', error.stack)
      return {
        statusCode: 500,
        body: 'Internal server error'
      }
    }
  }
}

const handler = new Handler()
module.exports = handler.main.bind(handler)