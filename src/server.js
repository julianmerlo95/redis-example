const express = require("express");
const axios = require("axios");
const redis = require("redis");
const cors = require("cors");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const REDIS_DEFAULT_EXPIRATION = 2500;
const REDIS_PHOTOS_KEY = "photos";
const API_BASE_EXTERNAL_URI = "https://jsonplaceholder.typicode.com";
const API_BASE_PATH = "/api";
const API_PORT = process.env.PORT || 3000;

const redisClient = redis.createClient();

// Route
app.get(`${API_BASE_PATH}/photos`, async (req, res) => {
    try {
        const redisValue = await redisClient.get(REDIS_PHOTOS_KEY);

        if (redisValue != null) {
            const response = redisValue;
            res.json(JSON.parse(response));
        } else {
            const response = getPhotos();
            setRedisKey(REDIS_PHOTOS_KEY, response);
            res.json(response);
        }
    } catch (error) {
        console.error(`Error finding redis value, ${error}`);
        throw error;
    }
});

async function getPhotos() {
    const { data } = await axios.get(`${API_BASE_EXTERNAL_URI}/photos`);
    return data;
}

async function setRedisKey(key, data) {
    await redisClient.setEx(key, REDIS_DEFAULT_EXPIRATION, JSON.stringify(data));
}

// Server
app.listen(API_PORT, async () => {
    await redisClient.connect();
    console.log(`Server is running with port ${API_PORT}`);
})
