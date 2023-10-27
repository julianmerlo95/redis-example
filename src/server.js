const express = require("express");
const axios = require("axios");
const redis = require("redis");
const cors = require("cors");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const REDIS_DEFAULT_EXPIRATION = 2500;
const REDIS_KEY = "photos";
const API_BASE_URI = "https://jsonplaceholder.typicode.com";
const API_PORT = process.env.PORT || 3000;

const redisClient = redis.createClient();

// Route
app.get("/api/photos", async (req, res) => {
    try {
        const redisValue = await redisClient.get(REDIS_KEY);

        if (redisValue != null) {
            const response = redisValue;
            res.json(JSON.parse(response));
        } else {
            const data = getPhotos();
            setRedisKey(REDIS_KEY, data);
            res.json(data);
        }
    } catch (error) {
        console.error(`Error finding redis value, ${error}`);
        throw error;
    }
});

async function getPhotos() {
    const { data } = await axios.get(`${API_BASE_URI}/photos`);
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
