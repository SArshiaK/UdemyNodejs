const fs = require("fs");
const path = require('path')
const { parse } = require("csv-parse");

const planets = require('./planets.mongo');


function isHapitablePlanet(planet) {
    return planet["koi_disposition"] === "CONFIRMED" && planet["koi_insol"] > 0.36 && planet["koi_insol"] < 1.11 && planet["koi_prad"] < 1.6;
}

function loadPlanetsData(){

    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname,'..', '..', 'data', "kepler_data.csv"))
        .pipe(
            parse({
                comment: "#",
                columns: true,
            })
        )
        .on("data", async (data) => {
            if (isHapitablePlanet(data)) {
                savePlanet(data);
            }
        })
     
        .on("error", (err) => {
            console.log(err);
            reject(err);
        })
    
        .on("end", async () => {
            const countPlanetFound = (await getAllplanets()).length;
            console.log(`${countPlanetFound} hapitable planets found!`);
            console.log("DONE!");
            resolve();
        });
    });
}

async function getAllplanets(){
    return await planets.find({}, {
        '_id':0, "__v":0,
    });
}

async function savePlanet(planet){
    try{
        await planets.updateOne({
            keplerName: planet.kepler_name,
        },
        {
            keplerName: planet.kepler_name,// TODO: put planet instead of this {}
        },
        {
            upsert: true,
        }); 
    }
    catch (err){
        console.error(`Couldn't save planet ${err}`);
    }

}

module.exports = {
    loadPlanetsData,
    // planets: hapitablePlanets,
    getAllplanets
}