import { Loader, LoaderOptions } from 'google-maps';

var googleReady = false;
let geocoder;
async function initGoogle() {
    const loader = new Loader(process.env.REACT_APP_GMAPS_API_KEY, { });    
    const google = await loader.load();
    geocoder = new google.maps.Geocoder();
    googleReady = true;
}

initGoogle();

function lookupGeocodePromise(latlng) {
    return new Promise((res, rej) => {
        geocoder.geocode({ "location": latlng }, function(results, status) {
             res({ results, status });
        });
    });
}


export default async function reverseGeocode(long, lat, callback) {
    const latlng = {
        lat: lat,
        lng: long
    };
    
    if (!googleReady) {
        return  { success: false, error: "Google not ready", address: "", location: latlng }; 
    }

    const { results, status } = await lookupGeocodePromise(latlng);
    
    if (status === "OK") {
        console.log(results[0].formatted_address);
        return { success: true, error: null, address: results[0].formatted_address, location: latlng };
    }

    return { success: false, error: status, address: "", location: latlng };
}
