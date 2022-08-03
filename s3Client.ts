import { S3Client, GetObjectCommand, GetObjectCommandInput, SelectObjectContentCommandInput, SelectObjectContentCommand, SelectObjectContentEventStream } from "@aws-sdk/client-s3";

export class s3client {
  private readonly client: S3Client = new S3Client({region: process.env.AWS_REGION});

  public async getObjectContent(bucketName: string, key: string) : Promise<string | undefined> {
    const streamToString = (stream : NodeJS.ReadableStream | ReadableStream | Blob) =>
    new Promise<string>(async(resolve, reject) => {
      try {
        var njrs = stream as NodeJS.ReadableStream;
        var rs = stream as ReadableStream<Uint8Array>;
        var blob = stream as Blob;

        if (njrs !== undefined) {
          const chunks = [new Uint8Array()];
          njrs.on("data", (chunk : Uint8Array) => chunks.push(chunk));
          njrs.on("error", reject);
          njrs.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        } else if (rs !== undefined) {
          const chunks = [new Uint8Array()];
          var reader: ReadableStreamDefaultReader<Uint8Array> = rs.getReader();
          while (true) {
            const promiseResult : Promise<ReadableStreamDefaultReadResult<any>> = reader.read();
            const readResult : ReadableStreamDefaultReadResult<any> = await promiseResult;
            if (readResult.done) {
              break;
            }

            if (readResult.value) {
              chunks.push(readResult.value);
            }
          }
          resolve(Buffer.concat(chunks).toString("utf8"))
        } else if (blob !== undefined) {
          var str = await blob.text();
          resolve(str);
        } else {
          reject("no matching type");
        }
      } catch (err) {
        console.error(err);
        reject("error");
      }
    });
  
    var input: GetObjectCommandInput = {Bucket: bucketName, Key: key};
    const command = new GetObjectCommand(input);
    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode == 200) {
      if (response.Body) {
        const body = await streamToString(response.Body);
        return body;
      } else {
        console.warn("GetObject did not have body for key " + key);
        return undefined;
      }
    } else {
      var str = JSON.stringify(response.$metadata);
      console.warn("GetObject did not receive 200 for key " + key + ".\n" + str);
      return undefined;
    }
  }

  public async getFieldFromJson(bucketName: string, key: string, field: string) : Promise<string | undefined> {
    const asyncIterableStreamToString = (asyncIterable : AsyncIterable<SelectObjectContentEventStream>) =>
      new Promise<string>(async(resolve, reject) => {
        try {
          const chunks = [new Uint8Array()];
          for await (const selectObjectContentEventStream of asyncIterable) {
            if (selectObjectContentEventStream.Records) {
              if (selectObjectContentEventStream.Records.Payload) {
                chunks.push(selectObjectContentEventStream.Records.Payload);
              }
            }
  
            if (selectObjectContentEventStream.End) {
              resolve(Buffer.concat(chunks).toString("utf8"))
            }
          }
        } catch (err) {
          console.error(err);
          reject();
        }
      }
    );
  
    var input: SelectObjectContentCommandInput = {
      Bucket: bucketName,
      Key: key,
      ExpressionType: 'SQL',
      Expression: `SELECT ${field} FROM S3Object[*].${field};`,
      InputSerialization: {
        JSON: {
          Type: 'DOCUMENT',
        }
      },
      OutputSerialization: {
        JSON: {
          RecordDelimiter: ','
        }
      }
    }
    const command = new SelectObjectContentCommand(input);
    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode == 200) {
      if (response.Payload) {
        const body = await asyncIterableStreamToString(response.Payload);
        var json = JSON.parse(body.replace('},', '}'));
        var val = json[field];
        return val;
      } else {
        console.warn("S3Select did not have payload for key " + key);
        return undefined;
      }
    } else {
      var str = JSON.stringify(response.$metadata);
      console.warn("S3Select did not receive 200 for key " + key + ".\n" + str);
      return undefined;
    }
  }
}
