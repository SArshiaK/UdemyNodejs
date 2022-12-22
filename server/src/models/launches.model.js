const axios = require('axios');

const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

const launches = new Map();

const DEFAULT_FLIGHT_NUMBER = 100;

// const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches';
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading data from Spacex api ... ');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    })
    
    if(response.status !== 200) {
        console.log(`An error occured while downloading data from ${SPACEX_API_URL}`)
        throw new Error('Launch data download failed!')
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs){
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })
    
        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers,     
    
        };
        console.log(`${launch.flightNumber} ${launch.mission}`);
        
        await saveLaunch(launch);
    }
}

async function loadLaunchesData(){
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });
    if(firstLaunch) {
        console.log('Launch data already loaded!');
    }
    else{
        await populateLaunches();
    }
};

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId){
    return await findLaunch({flightNumber: launchId});
}

async function getLatestFlightNumber(){
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');

    if(!latestLaunch){
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit){
    return await launchesDatabase
        .find({}, {'_id':0,"__v":0})
        .sort({flightNumber: 1})
        .skip(skip)
        .limit(limit);
    }

async function saveLaunch(launch){
    await launchesDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert:true,
    })
}

async function scheduleNewLaunch(launch){
    const planet = await planets.findOne({keplerName:launch.target,});

    if(!planet){
        throw new Error('No matching planet was found');
    }

    const newFlightNumber = await getLatestFlightNumber() + 1;
    const newLaunch = Object.assign(launch, {
        flightNumber: newFlightNumber,
        customers: ['Arshia', 'NASA'],
        upcoming: true,
        success: true
    });
    await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId){
    const aborted = await launchesDatabase.updateOne({
        flightNumber: launchId,
    },{
        upcoming: false,
        success: false,
    });
    // we cheked the wxistance with "existsLaunchWithId" function before, 
    // so we don't need to use "upsert" here
    
    // ???????????
    // return aborted.ok === 1 && aborted.nModified === 1; 

    return aborted.modifiedCount === 1 && aborted.matchedCount === 1;

    // return true;
}



module.exports = {
    loadLaunchesData,
    // launches:launches,
    existsLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunchById
}; 