import React from 'react';
import ReactMapGL, { Marker } from "react-map-gl";
import Ably from "ably/promises";
import simulateAblyMessages from "./FakeAbly";
import reverseGeocode from "./Geocode";

const client = new Ably.Realtime(process.env.REACT_APP_ABLY_API_KEY);
client.connection.on(function(stateChange) {
    console.log('New connection state is ' + stateChange.current)
})

const animateBuses = false;

export default class Map extends React.Component {

    constructor() {
        super();
     
        this.bounds = {};
        this.tooltipStyle = {};
        this.state = {
            viewport: {
                latitude: 41.767179,
                longitude: -72.658395,
                width: "calc(100vw - 470px)",
                height: "100vh",
                zoom: 12
            },
            vehicles: {},
            isHovering: false,
            isSelected: "",
            busAddress: ""
        };        
    }

    componentDidMount() {
        // simulateAblyMessages();
        this.map = this.mapRef.getMap();

        const channel = client.channels.get('[product:cttransit/gtfsr]vehicle:all');
        channel.attach((err, r) => {
            channel.subscribe((message) => this.travelDataArrived(message));            
        });
    }

    async decorateWithRealAddress(vehicleId, e) {
        const v = this.state.vehicles[vehicleId];
        this.tooltipStyle = {transform: e.target.parentNode.style.transform};
        const result = await reverseGeocode(v.vehicle.position.longitude, v.vehicle.position.latitude);
        v.address = result.address;        
        this.setState({
            vehicles: this.state.vehicles,
            isHovering: true,
            busAddress: result.address
        });
    }

    hideTooltip() {
        this.setState({ isHovering: false });
    }

    travelDataArrived(message) {
        const vehicleDictionary = this.state.vehicles;
        
        message.data.address = "";
        
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

    getBusesToRender() {
        if (!this.map) { 
            return []; 
        }

        this.bounds = this.map.getBounds();
        const ids = Object.getOwnPropertyNames(this.state.vehicles);

        const items = [];
        for (let id of ids) {
            const vehicle = this.state.vehicles[id];

            if (vehicle.vehicle.position.latitude >= this.bounds._sw.lat 
                && vehicle.vehicle.position.latitude <= this.bounds._ne.lat
                && vehicle.vehicle.position.longitude >= this.bounds._sw.lng 
                && vehicle.vehicle.position.longitude <= this.bounds._ne.lng) {
                    items.push(this.state.vehicles[id]);
            }
        }

        return items;
    }

    selectBus(e, v) {
        e.preventDefault();
        this.setState({ isSelected: v.id });
        console.log(v.vehicle.position.latitude, v.vehicle.position.latitude);
        this.map.flyTo({ 
            center: [v.vehicle.position.longitude, v.vehicle.position.latitude],
            zoom: 17, 
        });
    }

    render() {

        const items = this.getBusesToRender();
        
        return (
            <main>
                <section className="data">
                    <img className="image" src="https://cdn.glitch.com/859b92c7-9c2f-4724-aaec-1c00c6291962%2Fbus.jpg?v=1588763935046" alt="CT Fastrak bus"/>
                    <h1>Live Bus Journey Data from CT Transit</h1>
                    <h2>Select a bus to highlight it on the map</h2>
                    <ul className="buses">
                        {items.map((v, i) => (
                            <li className="bus" key={"key" + v.id} className={"bus" + i}>
                                <a className="bus-link" onClick={evt => this.selectBus(evt, v)} href="#">Bus {v.id}</a>
                            </li>   
                        ))}
                    </ul>
                </section>
                <ReactMapGL 
                    ref={ map => this.mapRef = map }
                    {...this.state.viewport}
                    mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/thisisjofrank/ck9v60gp307uq1inhceylpzdi"
                    onViewportChange={ v => { this.setState({ viewport: v }) } }           
                >
                    {items.map((v, i) => (
                        <Marker key={v.id} latitude={v.vehicle.position.latitude} longitude={v.vehicle.position.longitude}>
                            <span className={`bus${i} ${this.state.isSelected === v.id ? "selected" : ""}`} id={"v" + v.id} role="img" aria-label="bus icon" onMouseOver={ evt => this.decorateWithRealAddress(v.id, evt)} onMouseLeave={evt => this.hideTooltip()}>🚌</span>
                        </Marker>
                    ))}
                    { 
                        this.state.isHovering &&
                        <div className="tooltip" style={this.tooltipStyle}>
                            <span>{this.state.busAddress}</span>
                        </div>
                    }
                </ReactMapGL>              
            </main>
        );
    }     
 }