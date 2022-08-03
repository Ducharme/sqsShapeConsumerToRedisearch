import { fileDiffList, fileList } from "./shapeTypes";

export function getFileDiffList(fl_s3: fileList, fl_re: fileList) : fileDiffList {
    var fdl : fileDiffList = {
      activeToCreate: [],
      activeToKeep: [],
      activeToInactivate: [],
      activeToRemove: [],
      activeToDelete: [],
      inactiveToCreate: [],
      inactiveToKeep: [],
      inactiveToActivate: [],
      inactiveToDelete: [],
      inactiveToRemove: [],
      deletedToCreate: [],
      deletedToKeep: [],
      deletedToRemove: []
    }
  
    // ACTIVE from S3
    for (const item of fl_s3.activeFiles) {
      if (fl_re?.activeFiles?.includes(item)) {
        fdl.activeToKeep.push(item);
      } else if (fl_re?.inactiveFiles?.includes(item)) {
        fdl.inactiveToActivate.push(item);
      } else if (fl_re?.deletedFiles?.includes(item)) {
        console.warn(`Deleted item ${item} cannot be activated again`);
      } else {
        fdl.activeToCreate.push(item);
      }
    }
  
    // ACTIVE from S3 -> From Redis perspective
    for (const item of fl_re.activeFiles) {
      if (fl_s3?.activeFiles?.includes(item)) {
        // Already handled, nothing to do
      } else if (fl_s3?.inactiveFiles?.includes(item)) {
        // Will be handled next, nothing to do
      } else if (fl_s3?.deletedFiles?.includes(item)) {
        // Will be handled next, nothing to do
      } else {
        fdl.activeToRemove.push(item);
      }
    }
  
    // INACTIVE from S3
    for (const item of fl_s3.inactiveFiles) {
      if (fl_re?.activeFiles?.includes(item)) {
        fdl.activeToInactivate.push(item);
      } else if (fl_re?.inactiveFiles?.includes(item)) {
        fdl.inactiveToKeep.push(item);
      } else if (fl_re?.deletedFiles?.includes(item)) {
        console.warn(`Deleted item ${item} cannot be activated again`);
      } else {
        fdl.inactiveToCreate.push(item);
      }
    }
  
    // INACTIVE from S3 -> From Redis perspective
    for (const item of fl_re.inactiveFiles) {
      if (fl_s3?.activeFiles?.includes(item)) {
        // Already handled, nothing to do
      } else if (fl_s3?.inactiveFiles?.includes(item)) {
        // Already handled, nothing to do
      } else if (fl_s3?.deletedFiles?.includes(item)) {
        // Will be handled next, nothing to do
      } else {
        fdl.inactiveToRemove.push(item);
      }
    }
  
    // DELETED from S3
    for (const item of fl_s3.deletedFiles) {
      if (fl_re?.activeFiles?.includes(item)) {
        fdl.activeToDelete.push(item);
      } else if (fl_re?.inactiveFiles?.includes(item)) {
        fdl.inactiveToDelete.push(item);
      } else if (fl_re?.deletedFiles?.includes(item)) {
        fdl.deletedToKeep.push(item);
      } else {
        fdl.deletedToCreate.push(item);
      }
    }
  
    // DELETED from S3 -> From Redis perspective
    for (const item of fl_re.deletedFiles) {
      if (fl_s3?.activeFiles?.includes(item)) {
        // Already handled, nothing to do
      } else if (fl_s3?.inactiveFiles?.includes(item)) {
        // Already handled, nothing to do
      } else if (fl_s3?.deletedFiles?.includes(item)) {
        // Already handled, nothing to do
      } else {
        fdl.deletedToRemove.push(item);
      }
    }
  
    return fdl;
  }