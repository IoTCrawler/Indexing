const { cleanEnv, str, port } = require('envalid'); // eslint-disable-line @typescript-eslint/no-var-requires

type envType = {
    MONGO_USER: string;
    MONGO_PASSWORD: string;
    MONGO_HOST: string;
    MONGO_DB: string;
    PORT: number;

    LD_CONTEXT: string;
    INDEXER_HOST: string;
};

export const env: envType = cleanEnv(process.env, {
    MONGO_USER: str(),
    MONGO_PASSWORD: str({}),
    MONGO_HOST: str({ devDefault: 'localhost:27017' }),
    MONGO_DB: str({ default: 'iotcrawler' }),
    PORT: port({ devDefault: 3000 }),
    LD_CONTEXT: str(),
    INDEXER_HOST: str()
} as envType, {
    transformer: (env: envType): envType => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        ...env,
        MONGO_USER: encodeURIComponent(env.MONGO_USER),
        MONGO_PASSWORD: encodeURIComponent(env.MONGO_PASSWORD),
        MONGO_DB: encodeURIComponent(env.MONGO_DB)
    })
});
