const AWS = require('aws-sdk')
const { Writable, pipeline } = require('stream')
const csvToJson = require('csvtojson')
const { rejects } = require('assert')

class Handler {
  constructor ({s3Svc, sqsSvc}) {
    this.s3Svc = s3Svc
    this.sqsSvc = sqsSvc
    this.queueName = process.env.SQS_QUEUE
  }
  static getSdks() {
    const host = process.env.LOCALSTACK_HOST || 'localhost'
    const s3Port = process.env.S3_PORT || '4566'
    const sqsPort = process.env.SQS_PORT || '4566'
    const isLocal = process.env.IS_LOCAL
    const s3Endpoint = new AWS.Endpoint(
      `http://${host}:${s3Port}`
    )
    const s3Config = {
      endpoint: s3Endpoint,
      s3ForcePathStyle: true
    }

    const sqsEndpoint = new AWS.Endpoint(
      `http://${host}:${sqsPort}`
    )

    const sqsConfig = {
      endpoint: sqsEndpoint
    }

    if (!isLocal) {
      delete s3Config.endpoint
      delete sqsConfig.endpoint
    }

    return {
      s3: new AWS.S3(s3Config),
      sqs: new AWS.SQS(sqsConfig)
    }
  }
  async getQueueUrl() {
    const { QueueUrl } = await this.sqsSvc.getQueueUrl({
      QueueName: this.queueName
    }).promise()

    return QueueUrl
  }
  processDataOnDemand(queueUrl) {
    const writableStrem = new Writable({
      write: (chunk, encondig, done) => {
        const item = chunk.toString()
        console.log('sending...', item, 'at', new Date().toISOString())
        this.sqsSvc.sendMessage({
          QueueUrl: queueUrl,
          MessageBody: item
        }, done)    
      }
    })

    return writableStrem
  }
  async pipeFyStreams(...args) {
    return new Promise((resolve, reject) => {
      pipeline(...args, 
        error => error ? reject(error) : resolve())
    })
  }

  async main(event) {
    const [
      {
        s3: {
          bucket: {
            name
          },
          object: {
            key
          }
        }
      }
    ] = event.Records
    console.log('processing: ', name, key)
    try {
      console.log('getting queueUrl...')
      const queueUrl = await this.getQueueUrl()
      const params = {
        Bucket: name, Key: key
      }
      
      await this.pipeFyStreams(
        this.s3Svc
          .getObject(params)
          .createReadStream(),
        csvToJson(),
        this.processDataOnDemand(queueUrl)
      )

      return {
        statusCode: 200,
        body: 'Process finish with success!'
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

const { s3, sqs } = Handler.getSdks()
const handler = new Handler({
  sqsSvc: sqs,
  s3Svc: s3
})
module.exports = handler.main.bind(handler)