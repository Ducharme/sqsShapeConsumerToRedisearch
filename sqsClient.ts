import { SQSClient, ReceiveMessageCommand, DeleteMessageBatchCommand, ReceiveMessageCommandOutput, Message } from "@aws-sdk/client-sqs";

export class sqsClient {

  public readonly sqsQueueUrl = process.env.SQS_QUEUE_URL;
  public readonly sqsParams = {
    MaxNumberOfMessages: 10,
    QueueUrl: this.sqsQueueUrl,
    VisibilityTimeout: 20,
    WaitTimeSeconds: 10
  };

  private readonly sqsClient = new SQSClient({ region: process.env.AWS_REGION });

  private readonly messageHandler: Function;
  private readonly reduceHandler: Function;
  private readonly processHandler: Function;

  constructor(messageHandler: Function, reduceHandler: Function, processHandler: Function) {
    this.messageHandler = messageHandler;
    this.reduceHandler = reduceHandler;
    this.processHandler = processHandler;
  }

  private async processReceivedMessages<T>(messages : Message[]) {
    var fullList : T[] = [];
    for (const msg of messages) {
      if (msg.Body === undefined)
        continue;

      var item: T = this.messageHandler(msg);
      fullList.push(item);
    }

    try {
      var reducedList = this.reduceHandler(fullList);
      this.processHandler(reducedList);

      var deleteBatchParams = {
        QueueUrl: this.sqsQueueUrl,
        Entries: (messages.map((message, index) => ({
          Id: `${index}`,
          ReceiptHandle: message.ReceiptHandle,
        })))
      };
  
      const dmbc = new DeleteMessageBatchCommand(deleteBatchParams);
      await this.sqsClient.send(dmbc);
    } catch (err) {
      console.log("Error deleting batch messages", err);
    }
  }

  public async run<T>() {
    while (true) {
      try {
        const rmc = new ReceiveMessageCommand(this.sqsParams);
        const data : ReceiveMessageCommandOutput = await this.sqsClient.send(rmc);
        if (data.Messages) {
          // NOTE: Could await next call but performance is better when called async
          this.processReceivedMessages<T>(data.Messages);
        }
      } catch (err) {
        console.log("Error handling redis messages", err);
      } finally {
        console.log("Waiting...");
      }
    }
  }
}
