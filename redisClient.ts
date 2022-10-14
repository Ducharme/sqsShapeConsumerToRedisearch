import { Shape, ShapeArray, ShapeStatus, ShapeType } from "./shapeTypes";
const redis = require("redis");


export class redisClient {
    private readonly params = { 'socket': { 'host': process.env.REDIS_HOST } };
    private readonly client = redis.createClient(this.params);
    private readonly shapeChangedChannel = "ShapeChanged";
    private alive = false;

    constructor() {
        this.client.on("connect", () => {
            console.log('Redis client connected');
        });
        this.client.on("ready", () => {
            console.log('Redis client ready');
            this.alive = true;
        });
        this.client.on("end", () => {
            this.alive = false;
            console.log('Redis client disconnected');
        });
        this.client.on("reconnecting", () => {
            this.alive = false;
            console.log('Redis client reconnecting');
        });
        this.client.on("error", function(error: any) {
            console.error(error);
        });
    }

    public async connect() {
        await this.client.connect();
    }

    public async ping() {
        await this.client.ping();
    }

    public async isHealthy() {
        return this.alive;
    }

    public async getShapeType(type: ShapeType) : Promise<ShapeArray> {
        console.log(`Getting list of ${type} from redis.`);
        const indexName = 'shape-type-idx';
        const filter = `@type:(${type})`;
        const retArr = ['$.shapeId', 'AS', 'shapeId', '$.name', 'AS', 'name', '$.status', 'AS', 'status'];
        console.debug(`Query => FT.SEARCH ${indexName} ${filter} RETURN ${retArr.length} ${retArr.join(" ")}`);
        
        var response = await this.client.ft.search(indexName, filter, { RETURN: retArr })
        console.log(`Getting list of ${type} from redis succeeded. Total of ${response.total} shapes found`);
        return response.documents as ShapeArray;
    }

    public async createShape(shape: Shape) : Promise<any> {
        var key = 'SHAPELOC:' + shape.shapeId;
        return this.client.json.set(key, '$', shape)
            .catch((err: any) => console.log(`createShape failed for ${key} -> ${err}`));
    }

    public async changeShapeStatus(shapeId: string, status: ShapeStatus, modifiedAt: string) : Promise<any> {
        var key = 'SHAPELOC:' + shapeId;
        var p1 = this.client.json.set(key, '$.status', status.toString());
        var p2 = this.client.json.set(key, '$.modifiedAt', modifiedAt);
        return Promise.all([p1, p2])
            .catch((err: any) => console.log(`changeShapeStatus failed for ${key} -> ${err}`));
    }

    public async removeShape(shapeId: string) : Promise<any> {
        var key = 'SHAPELOC:' + shapeId;
        return this.client.del(key)
            .catch((err: any) => console.log(`removeShape failed for ${key} -> ${err}`));
    }

    public async publishChange(type: ShapeType) : Promise<any> {
        const channel = this.shapeChangedChannel;
        return this.client.publish(channel, type.toString())
            .catch((err: any) => console.log(`Publish to ${channel} failed for ${type} -> ${err}`));
    }
}
