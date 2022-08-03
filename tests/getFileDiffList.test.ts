import { fileList } from "../shapeTypes";
import { getFileDiffList } from "../shapeDiffFinder";


describe('getFileDiffList', function() {

  function getFileList(activeFiles: string[], inactiveFiles : string[], deletedFiles: string[]) : fileList {
    var fl : fileList = {
      activeFiles : activeFiles,
      inactiveFiles : inactiveFiles,
      deletedFiles : deletedFiles,
      shapeType: "PARKING"
    }
    return fl;
  }

  it('sameAsRedis', function() {
    var fl_s3 = getFileList(['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']);
    var fl_re = getFileList(['b', 'a', 'c'], ['f', 'e', 'd'], ['h', 'i', 'g']);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.activeToKeep.length).toBe(3);
    expect(fdl.inactiveToKeep.length).toBe(3);
    expect(fdl.deletedToKeep.length).toBe(3);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  it('activeItemWasCreated', function() {
    var fl_s3 = getFileList(['a', 'b', 'c'], [], []);
    var fl_re = getFileList(['a', 'b'], [], []);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.activeToCreate.length).toBe(1); // Missing 'c'
    expect(fdl.activeToKeep.length).toBe(2);
    // Rest must be at 0
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToKeep.length).toBe(0);
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  // ACTIVE

  it('activeItemBecameInactive', function() {
    var fl_s3 = getFileList(['a', 'b'], ['c'], []);
    var fl_re = getFileList(['a', 'b', 'c'], [], []);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.activeToKeep.length).toBe(2);
    // From active to inactive for 'c'
    expect(fdl.activeToInactivate.length).toBe(1);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToKeep.length).toBe(0);
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  it('activeItemWasDeleted', function() {
    var fl_s3 = getFileList(['a', 'c'], [], ['b']);
    var fl_re = getFileList(['a', 'b', 'c'], [], []);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.activeToKeep.length).toBe(2);
    // From active to deleted for 'c'
    expect(fdl.activeToDelete.length).toBe(1);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToKeep.length).toBe(0);
    expect(fdl.deletedToRemove.length).toBe(0);
  });


  // INACTIVE

  it('inactiveItemBecameActive', function() {
    var fl_s3 = getFileList(['a', 'b', 'c'], [], []);
    var fl_re = getFileList(['b', 'c'], ['a'], []);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.activeToKeep.length).toBe(2);
    // From inactive to active for 'a'
    expect(fdl.inactiveToActivate.length).toBe(1);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToKeep.length).toBe(0);
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  it('inactiveItemWasDeleted', function() {
    var fl_s3 = getFileList(['a', 'c'], [], ['b']);
    var fl_re = getFileList(['a', 'c'], ['b'], []);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.activeToKeep.length).toBe(2);
    // From active to deleted for 'b'
    expect(fdl.inactiveToDelete.length).toBe(1);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToKeep.length).toBe(0);
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  it('inactiveItemWasCreated', function() {
    var fl_s3 = getFileList(['a', 'c'], ['b'], []);
    var fl_re = getFileList(['a', 'c'], [], []);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.inactiveToCreate.length).toBe(1);
    expect(fdl.activeToKeep.length).toBe(2);
    // Rest must be at 0
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToKeep.length).toBe(0);
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  // DELETED

  it('allItemsWereDeleted', function() {
    var fl_s3 = getFileList([], [], ['a', 'b', 'c']);
    var fl_re = getFileList(['a'], ['b'], ['c']);
    var fdl = getFileDiffList(fl_s3, fl_re);

    // From active to deleted for 'c'
    expect(fdl.activeToDelete.length).toBe(1);
    expect(fdl.inactiveToDelete.length).toBe(1);
    expect(fdl.deletedToKeep.length).toBe(1);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToKeep.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  it('deletedItemWasCreated', function() {
    var fl_s3 : fileList = {
      activeFiles : [],
      inactiveFiles : [],
      deletedFiles : ['a', 'b', 'c'],
      shapeType: "PARKING"
    }
    var fl_re : fileList = {
      activeFiles : [],
      inactiveFiles : [],
      deletedFiles : ['a', 'b'],
      shapeType: fl_s3.shapeType
    }
    var fl_s3 = getFileList([], [], ['a', 'b', 'c']);
    var fl_re = getFileList([], [], ['a', 'b']);
    var fdl = getFileDiffList(fl_s3, fl_re);

    expect(fdl.deletedToCreate.length).toBe(1);
    expect(fdl.deletedToKeep.length).toBe(2);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToKeep.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.activeToRemove.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.inactiveToRemove.length).toBe(0);
    expect(fdl.deletedToRemove.length).toBe(0);
  });

  // REMOVE

  it('extraActiveItemToRemove', function() {
    var fl_s3 = getFileList([], [], []);
    var fl_re = getFileList(['x1', 'xa'], ['y1', 'ya', 'yb'], ['z1']);
    var fdl = getFileDiffList(fl_s3, fl_re);

    // Extras to remove
    expect(fdl.activeToRemove.length).toBe(2);
    expect(fdl.inactiveToRemove.length).toBe(3);
    expect(fdl.deletedToRemove.length).toBe(1);
    // Rest must be at 0
    expect(fdl.activeToCreate.length).toBe(0);
    expect(fdl.activeToKeep.length).toBe(0);
    expect(fdl.activeToInactivate.length).toBe(0);
    expect(fdl.activeToDelete.length).toBe(0);
    expect(fdl.inactiveToCreate.length).toBe(0);
    expect(fdl.inactiveToKeep.length).toBe(0);
    expect(fdl.inactiveToActivate.length).toBe(0);
    expect(fdl.inactiveToDelete.length).toBe(0);
    expect(fdl.deletedToCreate.length).toBe(0)
    expect(fdl.deletedToKeep.length).toBe(0);
  });

});

