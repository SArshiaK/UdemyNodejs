const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL;
const LOCAL_MONGO = process.env.LOCAL_MONGO;
// const MONGO_URL = "mongodb+srv://arshia:sak13968105@nasacluster.qgcbs5i.mongodb.net/nasa?retryWrites=true&w=majority";


mongoose.connection.once('open', () => {
    console.log('MongoDB connection ready');
});

mongoose.connection.on('error', (err) => {
    console.error(err);
});
mongoose.set('strictQuery', true);

async function mongoConnect(){
    await mongoose.connect(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

async function mongoDisconnect(){
    await mongoose.disconnect();
}

module.exports = {
    mongoConnect,
    mongoDisconnect
}