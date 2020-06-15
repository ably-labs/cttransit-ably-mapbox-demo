import React from 'react';
import ReactMapGL, { Marker } from "react-map-gl";
import Ably from "ably/promises";
// import simulateAblyMessages from "./FakeAbly";
import reverseGeocode from "./Geocode";

// Set up a new instance of the Ably realtime library, replace the API key with your own in .env.local
const client = new Ably.Realtime(process.env.REACT_APP_ABLY_API_KEY);

export default class Map extends React.Component {

    constructor() {
        super();
     
        this.tooltipStyle = {};
        this.state = {
            viewport: {
                latitude: 41.767179,
                longitude: -72.658395,
                width: "100%",
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

        // uncomment below to use fake data while testing to save message credits
        // simulateAblyMessages((data) => this.travelDataArrived(data)); 

        this.map = this.mapRef.getMap();

        // Subscribe to the CT Transit GTFSR channel and listen for messages that are sent
        const channel = client.channels.get('[product:cttransit/gtfsr]vehicle:all');
        channel.attach((err, r) => {
            channel.subscribe((message) => this.travelDataArrived(message));
        });
    }

    travelDataArrived(message) {
        const vehicleDictionary = this.state.vehicles;        
        for (let bus of message.data) {
            bus.address = "";
            vehicleDictionary[bus.id] = bus;
        }

        this.setState({ vehicles: vehicleDictionary });
    }

    getVisibleBuses() {
        if (!this.map) { 
            return []; 
        }

        return Object.entries(this.state.vehicles)
                     .filter(([key, bus]) => { return this.isInBounds(this.map.getBounds(), bus.vehicle.position); })
                     .map(([key, bus]) => { return bus } );
    }

    isInBounds(bounds, latLong) {
        return latLong.latitude >= bounds._sw.lat 
                 && latLong.latitude <= bounds._ne.lat
                 && latLong.longitude >= bounds._sw.lng 
                 && latLong.longitude <= bounds._ne.lng;
    }

    selectBus(e, bus) {
        e.preventDefault();
        this.setState({ 
            viewport: this.viewportZoomedTo(bus, 16), 
            isSelected: bus.id 
        });
    }
    
    viewportZoomedTo(bus, zoom) {
        return {
            zoom: 16,
            latitude: bus.vehicle.position.latitude,
            longitude: bus.vehicle.position.longitude,
            width: this.state.viewport.width,
            height: this.state.viewport.height,
        };
    }

    async decorateWithRealAddress(vehicleId, e) {
        const v = this.state.vehicles[vehicleId];
        this.tooltipStyle = {transform: e.target.parentNode.style.transform};
        const result = await reverseGeocode(v.vehicle.position.longitude, v.vehicle.position.latitude);
        v.address = result.address;        
        this.setState({
            vehicles: this.state.vehicles,
            isHovering: v.id,
            busAddress: result.address
        });
    }

    hideTooltip() {
        this.setState({ isHovering: false });
    }

    render() {

        const items = this.getVisibleBuses();
        
        return (
            <main>
                <section className="data">
                    <img className="image" src="https://cdn.glitch.com/859b92c7-9c2f-4724-aaec-1c00c6291962%2Fbus.jpg?v=1588763935046" alt="CT Fastrak bus"/>
                    <h1>Live Bus Journey Data from CT Transit</h1>
                    { 
                        items.length 
                            ? <h2>Select a bus to highlight it on the map</h2> 
                            : <img src="https://cdn.glitch.com/859b92c7-9c2f-4724-aaec-1c00c6291962%2Floading.gif?v=1589459270889" className="loading" alt="loading" />
                    }
                   
                    <ul className="buses">
                        {items.map((v, i) => (
                            <li key={ "key" + v.id } className={"bus" + i +  " bus"}>
                                <a href="/"
                                   className={`bus-link ${this.state.isSelected === v.id ? "clicked" : ""} ${this.state.isHovering === v.id ? "hover" : ""}`} 
                                   onClick={ evt => this.selectBus(evt, v) }
                                >Bus { v.id }</a>
                            </li>   
                        ))}
                    </ul>
                </section>
                <ReactMapGL 
                    ref={ map => this.mapRef = map }
                    { ...this.state.viewport }
                    mapboxApiAccessToken={ process.env.REACT_APP_MAPBOX_TOKEN }
                    mapStyle="mapbox://styles/thisisjofrank/ck9v60gp307uq1inhceylpzdi"
                    onViewportChange={ v => { this.setState({ viewport: v }) } }           
                >
                    {items.map((v, i) => (
                        <Marker key={ v.id } latitude={ v.vehicle.position.latitude } longitude={ v.vehicle.position.longitude }>
                            <span className={ `bus${i} ${this.state.isSelected === v.id ? "selected" : ""}` } 
                                  role="img" 
                                  aria-label="bus icon" 
                                  onMouseOver={ evt => this.decorateWithRealAddress(v.id, evt) } 
                                  onMouseLeave={ evt => this.hideTooltip() }
                                  onClick={ evt => this.selectBus(evt, v) }
                            >🚌</span>
                        </Marker>
                    ))}
                    { 
                        this.state.isHovering && this.state.busAddress &&
                        <div className="tooltip" style={ this.tooltipStyle }>
                            <span>{ this.state.busAddress }</span>
                        </div>
                    }
                </ReactMapGL>              
            </main>
        );
    }     
 }