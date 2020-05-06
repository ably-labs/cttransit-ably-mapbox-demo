import React from 'react';
import ReactMapGL, { Marker } from "react-map-gl";

import Ably from "ably/promises";
const client = new Ably.Realtime(process.env.REACT_APP_ABLY_API_KEY);
client.connection.on(function(stateChange) {
    console.log('New connection state is ' + stateChange.current)
})

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
        this.listenForVehicles();
    }
    
    listenForVehicles() {
   
        const channel = client.channels.get('[product:cttransit/gtfsr]vehicle:all');
        channel.attach((err, r) => {
            channel.subscribe((message) => {
                const vehicleDictionary = this.state.vehicles;
                vehicleDictionary[message.data.id] = message.data;
                this.setState({ vehicles: vehicleDictionary });
            });            
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
                           <li className="bus">
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
                            <div>🚌</div>
                        </Marker>
                    ))}
                </ReactMapGL>
            </main>
        );
    }     
 }