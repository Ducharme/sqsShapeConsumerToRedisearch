import { Message } from "@aws-sdk/client-sqs";
import { fileList, Shape, shapeObject, ShapeStatus, ShapeType } from "./shapeTypes";
import { getFileDiffList } from "./shapeDiffFinder";
import { s3client } from "./s3Client";
import { redisClient } from "./redisClient";
import { sqsClient } from "./sqsClient";


var s3c = new s3client();
var rec = new redisClient();
var sq = new sqsClient(receivedMessageHandler, messagesReducer, processMessagesHandler);

function receivedMessageHandler(msg: Message) : shapeObject[] {
  var shapeObjects : shapeObject[] = []; // One list per ShapeType

  const body = JSON.parse(msg.Body!);
  // {"Service":"Amazon S3","Event":"s3:TestEvent","Time":"2022-10-11T14:51:13.969Z",
  // "Bucket":"lafleet-shape-repo-748293476463","RequestId":"P242ASWRKC0N7JVT",
  // "HostId":"HmDfdTt8rd5V87LqZLY5gIafwA+BwitouYKzhuWi1BprUYliOJF80xkbRFMd3wfsAdvpsnNZLWw="}
  if (body.Records == undefined || body.Event == "s3:TestEvent")
    return shapeObjects;

  for (const rec of body.Records) {
    var s3Item = rec.s3;
    if (s3Item === undefined || s3Item == "") {
      continue;
    }
    
    var s3bucket = s3Item.bucket;
    if (s3bucket === undefined || s3bucket == "") {
      continue;
    }

    var s3bucketName = s3bucket.name;
    if (s3bucketName === undefined || s3bucketName == "") {
      continue;
    }

    var s3obj = s3Item.object;
    if (s3obj === undefined || s3obj == "") {
      continue;
    }

    var s3key = s3obj.key;
    if (s3key === undefined || s3key == "") {
      continue;
    }

    const lst: shapeObject = {
      bucketName: s3bucketName,
      objectKey: s3key
    };
    shapeObjects.push(lst);
  }

  return shapeObjects;
}

function messagesReducer(list: shapeObject[]) : shapeObject[] {
  var shapeList : shapeObject[] = [];
  for (const item of list) { // Multiple files might have changed
    var alreadyExists = false;
    for (const sl of shapeList) { // Only one update is needed
      if (item.bucketName == sl.bucketName && item.objectKey == sl.objectKey) {
        alreadyExists = true;
        break;
      }
    }

    if (!alreadyExists) {
      shapeList.push(item);
    }
  }
  return shapeList;
}

function processMessagesHandler(list: shapeObject[]) {
  console.log("Shape files updated: " + JSON.stringify(list));
  for (const so of list) {
    processShapeObject(so);
  }
}

async function processShapeObject(sl: shapeObject) {
  console.log(sl.constructor.name);
  var fl_s3 = await getShapeTypeListFromS3(sl);
  if (fl_s3 == null) {
    console.warn("File list is null, skipping redis update");
    return;
  }

  const shapeType = fl_s3.shapeType as ShapeType;
  var fl_re = await getShapeTypeListFromRedis(shapeType);
  if (fl_re == null) {
    console.warn("File list is null from redis, skipping update");
    return;
  }

  var fdl = getFileDiffList(fl_s3, fl_re);
  console.log(JSON.stringify(fdl));

  var promises : Promise<any>[] = [];

  // CREATE
  for (const shapeId of fdl.activeToCreate) {
    var content = await s3c.getObjectContent(sl.bucketName, shapeId);
    if (content) {
      var shape = JSON.parse(content) as Shape;
      promises.push(rec.createShape(shape));
    }
  }
  for (const shapeId of fdl.inactiveToCreate) {
    var content = await s3c.getObjectContent(sl.bucketName, shapeId);
    if (content) {
      var shape = JSON.parse(content) as Shape;
      promises.push(rec.createShape(shape));
    }
  }
  for (const shapeId of fdl.deletedToCreate) {
    var content = await s3c.getObjectContent(sl.bucketName, shapeId);
    if (content) {
      var shape = JSON.parse(content) as Shape;
      promises.push(rec.createShape(shape));
    }
  }

  // CHANGE
  for (const shapeId of fdl.activeToInactivate) {
    var ma = await s3c.getFieldFromJson(sl.bucketName, shapeId, "modifiedAt");
    promises.push(rec.changeShapeStatus(shapeId, ShapeStatus.Inactive, ma!));
  }
  for (const shapeId of fdl.activeToDelete) {
    var ma = await s3c.getFieldFromJson(sl.bucketName, shapeId, "modifiedAt");
    promises.push(rec.changeShapeStatus(shapeId, ShapeStatus.Deleted, ma!));
  }
  for (const shapeId of fdl.inactiveToActivate) {
    var ma = await s3c.getFieldFromJson(sl.bucketName, shapeId, "modifiedAt");
    promises.push(rec.changeShapeStatus(shapeId, ShapeStatus.Active, ma!));
  }
  for (const shapeId of fdl.inactiveToDelete) {
    var ma = await s3c.getFieldFromJson(sl.bucketName, shapeId, "modifiedAt");
    promises.push(rec.changeShapeStatus(shapeId, ShapeStatus.Deleted, ma!));
  }

  // REMOVE
  for (const shapeId of fdl.activeToRemove) {
    promises.push(rec.removeShape(shapeId));
  }
  for (const shapeId of fdl.inactiveToCreate) {
    promises.push(rec.removeShape(shapeId));
  }
  for (const shapeId of fdl.deletedToRemove) {
    promises.push(rec.removeShape(shapeId));
  }
  
  var ret = await Promise.all(promises);
  console.log(`Create, change, remove promises returned ${JSON.stringify(ret)}`);

  // TODO: Only publish for the specific types which have changed
  var publishPromises : Promise<any>[] = [];
  publishPromises.push(rec.publishChange(ShapeType.Limit));
  publishPromises.push(rec.publishChange(ShapeType.NoGo));
  publishPromises.push(rec.publishChange(ShapeType.Parking));
  publishPromises.push(rec.publishChange(ShapeType.NoParking));
  var ret2 = await Promise.all(promises);
  console.log(`Publish promises returned ${JSON.stringify(ret2)}`);
}

async function getShapeTypeListFromS3(sl: shapeObject) : Promise<fileList | null> {
  try {
    console.log(`Getting object ${sl.objectKey} from s3 bucket ${sl.bucketName}`);
    
    var content = await s3c.getObjectContent(sl.bucketName, sl.objectKey);
    if (!content)
      return null;

    var json = JSON.parse(content);
    var type = json.type;
    
    var actives : string[] = [];
    for (const file of json.active) {
      actives.push(file);
    }
    var inactives : string[] = [];
    for (const file of json.inactive) {
      inactives.push(file);
    }
    var deleted : string[] = [];
    for (const file of json.deleted) {
      deleted.push(file);
    }

    const fl: fileList = { activeFiles: actives, inactiveFiles: inactives, deletedFiles: deleted, shapeType: type };
    console.log(`Getting object ${sl.objectKey} from s3 bucket ${sl.bucketName} succeeded`);
    console.log(`List of s3 ${fl.shapeType} has ${fl.activeFiles.length} active, ${fl.inactiveFiles.length} inactive, and ${fl.deletedFiles.length} deleted files`)
    return fl;
  } catch (err : any) {
    console.error(`Getting object ${sl.objectKey} from s3 bucket ${sl.bucketName} failed`, err);
    return null;
  }
}

async function getShapeTypeListFromRedis(type: ShapeType): Promise<fileList | null> {
  try {
    var sa = await rec.getShapeType(type);

    var actives : string[] = [];
    var inactives : string[] = [];
    var deleted : string[] = [];
    for (const item of sa) {
      switch (item.value.status) {
        case "ACTIVE":
          actives.push(item.value.shapeId);
        case "INACTIVE":
          inactives.push(item.value.shapeId);
          break;
        case "DELETED":
          deleted.push(item.value.shapeId);
          break;
        default:
          console.warn(`Shape ${JSON.stringify(item)} has am unrecognized status`);
      }
    }

    var fl: fileList = { activeFiles: actives, inactiveFiles: inactives, deletedFiles:deleted, shapeType: type};
    console.log(`List of redis ${fl.shapeType} has ${fl.activeFiles.length} active, ${fl.inactiveFiles.length} inactive, and ${fl.deletedFiles.length} deleted files`)
    return fl;
  } catch (err : any) {
    console.error(`Getting list of ${type} from redis failed`, err);
    return null;
  }
}


const run = async () => {
  await rec.connect();
  await rec.ping();
  sq.run<shapeObject>();
}

run();
