import { MongoClient, Db } from "mongodb";

interface MongoDocument {
  _id: string;
  title: string;
  docId: number;
  pin: number | null;
  s3Path: string | null;
  createdAt: Date;
  updatedAt: Date;
}

class MongoDBClient {
  private static instancePromise: Promise<MongoDBClient> | null = null;
  private client!: MongoClient;
  private db!: Db;

  private constructor() {}

  static getInstance(): Promise<MongoDBClient> {
    if (!MongoDBClient.instancePromise) {
      const instance = new MongoDBClient();
      MongoDBClient.instancePromise = instance
        .connect()
        .then(() => instance)
        .catch((err) => {
          MongoDBClient.instancePromise = null;
          throw err;
        });
    }
    return MongoDBClient.instancePromise;
  }

  private async connect(): Promise<void> {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/collabdocs";
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();
    await this.db
      .collection("documents")
      .createIndex({ docId: 1, pin: 1 }, { unique: true });
  }

  async ping(): Promise<void> {
    await this.db.command({ ping: 1 });
  }

  async getOne<T = MongoDocument>(
    collectionName: string,
    filter: object,
  ): Promise<T | null> {
    return (await this.db
      .collection(collectionName)
      .findOne(filter)) as T | null;
  }

  async updateOne(
    collectionName: string,
    filter: object,
    update: object,
    upsert: boolean = false,
  ): Promise<void> {
    await this.db
      .collection(collectionName)
      .updateOne(filter, update, { upsert });
  }
}

export type { MongoDocument };
export default MongoDBClient;
