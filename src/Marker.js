import { lineString, along, lineDistance } from '@turf/turf';
const OPTIONS = { units: 'feet' };
// 30.1 seconds, the .1 is to allow a buffer for the next set of cords to load
// I know it's not exact, but it's close :)
const STEPS = 30100;


//inside component function
useEffect(() => {
    let arc = [];
    let startTime = 0;
    if (!locations.length) {// exit if no cords in array
      return;
    }

    const line = lineString(locations); // our array of lat/lngs
    const distance = lineDistance(line, OPTIONS);
    for (let i = 0; i < distance; i += distance / STEPS) {
      let segment = along(line, i, OPTIONS);
      arc.push(segment.geometry.coordinates);
    }

    function animate(timestamp) {// animate function to set location
      const runtime = timestamp - startTime;
      const timeStep = Math.round(runtime);
      setCurrentLocation(arc[timeStep] || arc[arc.length - 1]);
      if (timeStep <= STEPS) {
        window.requestAnimationFrame(animate);
      }
    }
    window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(timeStamp => {
      startTime = timeStamp;
      animate(timeStamp);
    });
  },
  [locations]
);

return (
    <Marker coordinates={currentLocation} anchor="center">
      <div className="pulsating-circle" />;
    </Marker>
);