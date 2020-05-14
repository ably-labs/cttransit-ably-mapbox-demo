# mapfishtank

## Ably make realtime data APIs!

- One of the cool data source is CT transit buses
- Shows how high quality realtime data can be injested and redistributed using Ably Hub

Let's run through a cool mapping example

pre-reqs

- React
- Mapbox API
- Ably API
- Google Maps Geolookup API

## MapBox, Ubers answer to maps

- Free!
- well maintained!
- Reasonably fully featured

## MapBox Loves React

react-map-gl - not to be confused with other similarly named packages that also wrap mapbox
Provides react components for mapbox to do half our work for us
This is why the react ecosystem being so popular is useful

## Build a web app 

"what we wanted it to do"
- Show a map
- Put buses on map
- Have buses move in (Ably) real time
- allow people to click to highlight in some way, the bus they wanted to see

## Laying out the app

- Example directory structure
- App is just the entrypoint
- Map is our component

Use CRA, this is what we got.

## A look at our Map.js

- Creating state on startup, with empty dictionary of active buses
- setting the map viewport
- Using react-map-gl to draw a map

When the component does mount

- Sub to ably
- Add a callback that puts any arriving vehicles in our dictionary
- Any subsequent message from the hub for same vehicle overwrites the entry, updating the position

- Updates will trigger React to rerender because our vehicle dictionary is in the state object
- Woo! Moving buses

But why are the buses jumping rather than moving smoothly?

- Animating the markers was difficult
    - Two reasons, loads and loads of markers
    - The data didn't arrive in batches, it arrived in single bus events
    - Because of that, animating could lock up other bus arrivals unless we batched ourselves
    - A lot of code, for not much difference in UX because they don't move far quickly!
    - Remove, removed complexity

Let's add a sidebar

- This is a list of bus items pouplated with the bus data. The items are linked to the buses on the map so that clicking on a bus will pan and zoom to that bus on the map.

##Sidebar and Bus interactions

- Click on bus in the sidebar will pan and zoom to correct bus on map
- Clicking on a bus will zoom into that bus
- The sidebar will only show buses which are within the bounds of the map
- Hovering over a bus will highlight the bus name in the sidebar
- Hovering over a bus will show a tooltip with that bus' address

- Oh no! Animated panning to specific markers doesn't work!

    - Really weird implementation of flyTo and setCenter - (renders a new layer on the map, which didn't move the markers correctly, nor was it possible to pan or zoom on)
    - Luckily, we could just cause a pan/zoom by setting the viewport in the state, thus triggering the component to update


# Adding tooltips

- On click add flag in state
- on mouse out, remove flag from state
- Adding a tooltip to each marker won't work as the markers are aboslutely positioned (Child elements which are absolutely positioned will still sit underneath their parent's absolutely positioned siblings). Which means we need one absolutely positioned tooltip which is moved into the correct position.
- Luckily, when mapbox creates markers it places them with css transforms

- Therefore, on hover of a marker we can -
    - Get the transform of the parent
    - Apply it to the tooltip
    - Show the tooltip


## Geolookups!

Adding actual street addresses to the buses (data not given by the CT Transit data stream) 
- Geocode.js calls google maps api to turn lat long into an address
- passes lat long, uses google-maps NPM package
- Rate limited to 50,000 usages per hour
- So we can only really use it on interaction, or there's too many requests
- wrapped the google maps package in some promises so we could use async / await
- easier on the calling code, because we're not dealing with callbacks from the google sdk in our own code


- Conclusion

- Ably realtime transport and mapping works really well
- Really great consumer facing visualisation
- While the example is CT Transit other transport data sources could integrate in similar ways, with a similar UX to this example
- Or other data that's map-driven like logistics
- We can mash up apis from different vendors to build compelling user experiences.

## Other things we offer

- https://www.ably.io/hub 

--------------------------------------------------------

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
