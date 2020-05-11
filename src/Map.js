import React from 'react';
import ReactMapGL, { Marker } from "react-map-gl";

import Ably from "ably/promises";
const client = new Ably.Realtime(process.env.REACT_APP_ABLY_API_KEY);
client.connection.on(function(stateChange) {
    console.log('New connection state is ' + stateChange.current)
})

const animateBuses = false;

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

function simulateAblyMessages() {
    setInterval(() => { 
        starterFakeMessage.data.vehicle.position.longitude += 0.005000;
        const clone = JSON.parse(JSON.stringify(starterFakeMessage));  
        this.travelDataArrived(clone); 
    }, 1_000);  
}

export default class Map extends React.Component {

    constructor() {
        super();
        this.state = {
            viewport: {
                latitude: 41.767179,
                longitude: -72.658395,
                width: "calc(100vw - 470px)",
                height: "100vh",
                zoom: 12
            },
            vehicles: {}
        };        
    }

    componentDidMount() {
        // simulateAblyMessages();
        
        const channel = client.channels.get('[product:cttransit/gtfsr]vehicle:all');
        channel.attach((err, r) => {
            channel.subscribe((message) => this.travelDataArrived(message));            
        });     
    }

    travelDataArrived(message) {
        const vehicleDictionary = this.state.vehicles;
        
        if (!vehicleDictionary[message.data.id]) {
            vehicleDictionary[message.data.id] = message.data;
            this.setState({ vehicles: vehicleDictionary });
            return;
        }

        const current = vehicleDictionary[message.data.id];
        const updated = message.data;

        if (!animateBuses) {            
            vehicleDictionary[message.data.id] = updated;
            this.setState({ vehicles: vehicleDictionary });
            return;
        }
                  

        const targetFramerate = 60;
        const latShiftDirection  = current.vehicle.position.latitude > updated.vehicle.position.latitude ? -1 : 1;
        const longShiftDirection  = current.vehicle.position.longitude > updated.vehicle.position.longitude ? -1 : 1;
        const shiftLatPerTick = Math.abs(current.vehicle.position.latitude - updated.vehicle.position.latitude) / targetFramerate;
        const shiftLongPerTick = Math.abs(current.vehicle.position.longitude - updated.vehicle.position.longitude) / targetFramerate;

        let framesDelivered = 0;

        function animate(timestamp, component, c) {
            framesDelivered++;    
            c.vehicle.position.latitude += (shiftLatPerTick * latShiftDirection);
            c.vehicle.position.longitude += (shiftLongPerTick * longShiftDirection);   
        
            if (framesDelivered < targetFramerate) {
                component.setState({ vehicles:  vehicleDictionary });
                window.requestAnimationFrame(ts => animate(ts, component, c));
            } else {         
                vehicleDictionary[message.data.id] = updated;
                component.setState({ vehicles:  vehicleDictionary });         
            }
        }

        window.cancelAnimationFrame(0);
        window.requestAnimationFrame(timeStamp => {
            animate(timeStamp, this, current);
        });
    }

    render() {
        const items = [];
        const ids = Object.getOwnPropertyNames(this.state.vehicles);
        for (let id of ids) {
            items.push(this.state.vehicles[id]);
           
        }

        return (
            <main>
                <section className="data">
                    <img className="image" src="./bus.jpg" alt="CT Fastrak bus"/>
                    <h1>Live Bus Journey Data from CT Transit</h1>
                    <ul className="buses">
                        {items.map(v => (
                           <li className="bus" key={"key" + v.id}>
                           <h2>Bus {v.id}</h2>
                           <h3>lat: <span className="latlon">{v.vehicle.position.latitude}</span>,  lon: <span className="latlon">{v.vehicle.position.longitude}</span></h3>
                       </li>   
                        ))}
                    </ul>
                </section>
                <ReactMapGL 
                    {...this.state.viewport}
                    mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/thisisjofrank/ck9v60gp307uq1inhceylpzdi"
                    onViewportChange={ v => { this.setState({ viewport: v }) } }           
                >
                    {items.map(v => (
                        <Marker key={v.id} latitude={v.vehicle.position.latitude} longitude={v.vehicle.position.longitude}>
                            <span role="img" aria-label="bus icon">🚌</span>
                        </Marker>
                    ))}
                </ReactMapGL>
            </main>
        );
    }     
 }