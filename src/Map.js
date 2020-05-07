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
    }

    componentDidMount() {
        const channel = client.channels.get('[product:cttransit/gtfsr]vehicle:all');
        channel.attach((err, r) => {
            channel.subscribe((message) => this.travelDataArrived(message));            
        });      
    }

    componentDidUpdate() {
    }

    travelDataArrived(message) {
        const vehicleDictionary = this.state.vehicles;
        
        if (vehicleDictionary[message.data.id]) {
           // console.log("oooh I'm an update")
        } else {            
            vehicleDictionary[message.data.id] = message.data;
            this.setState({ vehicles: vehicleDictionary });
            return;
        }

        const STEPS = 3_000;
               
        // vehicleDictionary[message.data.id] = message.data;
        const current = vehicleDictionary[message.data.id];
        const updated = message.data;

        const totalShiftLat = current.vehicle.position.latitude - updated.vehicle.position.latitude;
        const totalShiftLong = current.vehicle.position.longitude - updated.vehicle.position.longitude; // x axis

        const shiftLatPerTick = totalShiftLat / STEPS;
        const shiftLongPerTick = totalShiftLong / STEPS;

        // console.log(shiftLatPerTick, shiftLongPerTick);
        
        let startTime = 0;
            
        
        function animate(timestamp, component) {

          const runtime = timestamp - startTime;
          const timeStep = Math.round(runtime);
         

          vehicleDictionary[message.data.id].vehicle.position.latitude += shiftLatPerTick;
          vehicleDictionary[message.data.id].vehicle.position.longitude += shiftLongPerTick;    


          
          if (timeStep <= STEPS) {
            window.requestAnimationFrame(ts => animate(ts, component));
          } else {
            // console.log("I reached three seconds");
            component.setState({ vehicles: vehicleDictionary });
          }
        }

        window.cancelAnimationFrame(0);

        window.requestAnimationFrame(timeStamp => {
          startTime = timeStamp;
          animate(timeStamp, this);
        });


        //this.setState({ vehicles: vehicleDictionary });
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