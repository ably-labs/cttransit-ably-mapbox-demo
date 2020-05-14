const starterFakeMessage = { 
    "name":"data",
    "id":"IarXNoZzs8:0:0",
    "data": {
        "id":"1430",
        "vehicle": {
            "position": { "latitude": 41.767179, "longitude": -72.658395, "bearing":90, "speed":0.0000034520621738920454 },
            "timestamp":"1588850403",
            "vehicle": { "id":"2430", "label": "1430" }
        }
    }
};

export default function simulateAblyMessages(callback) {
    setInterval(() => { 
        starterFakeMessage.data.vehicle.position.longitude += 0.005000;
        const clone = JSON.parse(JSON.stringify(starterFakeMessage));  
        callback(clone); 
    }, 1_000);  
}