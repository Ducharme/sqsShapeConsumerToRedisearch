import { Shape, ShapeStatus, ShapeType } from "../shapeTypes";
import * as fs from 'fs';


describe('loadShapeFromFile', function() {

  // npm t --watch --verbose
  it('montreal', function() {
    console.log("Current folder is " + __dirname);
    var mtlStr = fs.readFileSync(__dirname + '/montreal.json', 'utf8');
    var mtlJson = JSON.parse(mtlStr);
    var shape = mtlJson as Shape;

    expect(shape.shapeId).toBe("47db1f7b-5c0f-4f85-88d7-2bc3f83eaaf4");
    expect(shape.name).toBe("Montreal City");
    expect(shape.type).toBe("LIMIT");
    expect(shape.status).toBe("ACTIVE");
    expect(shape.modifiedAt).toBe("");
    expect(shape.deletedAt).toBe("");
    expect(shape.shapeVersion).toBe("0.0.1");
    expect(shape.schemaVersion).toBe("0.0.1");
    expect(shape.polygon[0][0]).toBe(45.703090820337195);
    expect(shape.polygon[0][1]).toBe(-73.47753036109698);
    expect(shape.filter.h3r1[0]).toBe("812bbffffffffff");
    expect(shape.shape.h3r8[0]).toBe("882b81b449fffff");
  });

  it('shapeStatus', function() {
    var status = ShapeStatus.Active;
    expect(status).toBe("ACTIVE");
    expect(status.toString()).toBe("ACTIVE");
  });

  it('ShapeType', function() {
    var type = ShapeType.Parking;
    expect(type).toBe("PARKING");
    expect(type.toString()).toBe("PARKING");
  });
})