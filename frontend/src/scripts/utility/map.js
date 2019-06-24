'use strict';

let L = window.L;

module.exports = Map;
module.exports.default = Map;

function Map(parameters_) {
	let parameters = this.parameters = Object.assign({
		container: 'map',
		// options: { minZoom: 4, maxZoom: 18 },
		// crs: L.CRS.Simple,
		// view: [[29.20107298174993, 121.05], 9],
	}, parameters_);
	parameters.options = Object.assign({
		options: { minZoom: 4, maxZoom: 18 },
		// crs: L.CRS.EPSG4326,
		maxBounds: [L.latLng(-85, -360), L.latLng(85, 360)],
		maxBoundsViscosity: 1.0,
	}, parameters_.options);
	/* map init */
	// Provide your access token
	L.mapbox.accessToken = 'pk.eyJ1IjoidHdpbGlnaHRzbm93IiwiYSI6ImNpaDFjY3Z4bzB4Nzd3d20wbzViaW1tZTIifQ.x0KTGUMMOGwjNkEbHlswrg';
	// Create a map in the div #map
	let leaflet = this.leaflet = L.map(parameters.container, parameters.options);
	if (parameters.view) {
		leaflet.setView(...parameters.view);
	}
	$('.leaflet-bottom.leaflet-right').remove();
	$('.leaflet-top.leaflet-left').remove();
	$('.leaflet-bottom').remove();
	//	添加一个街道的图层
	L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png').addTo(leaflet);
	// window.leaflet = leaflet;
}

Map.prototype = {
	getContainer: function () {
		return this.parameters.container;
	},

	setOffset: function (offset) {
		this.offset = offset;
	},

	toScreen: function ([lon, lat]) {
		if (this.offset) {
			let offset = this.offset(this.leaflet.getZoom());
			let p = this.leaflet.latLngToContainerPoint(L.latLng(lat + offset.lat, lon + offset.lon));
			return [p.x + offset.x, p.y + offset.y];
		} else {
			let p = this.leaflet.latLngToContainerPoint(L.latLng(lat, lon));
			return [p.x, p.y];
		}
	},

	toScreen_boundingbox: function ([[lon0, lon1], [lat0, lat1]]) {
		if (this.offset) {
			let offset = this.offset(this.leaflet.getZoom());
			let p0 = this.leaflet.latLngToContainerPoint(L.latLng(lat0 + offset.lat, lon0 + offset.lon)),
				p1 = this.leaflet.latLngToContainerPoint(L.latLng(lat1 + offset.lat, lon1 + offset.lon));
			return [[p0.x + offset.x, p1.x + offset.x], [p1.y + offset.y, p0.y + offset.y]];
		} else {
			let p0 = this.leaflet.latLngToContainerPoint(L.latLng(lat0, lon0)),
				p1 = this.leaflet.latLngToContainerPoint(L.latLng(lat1, lon1));
			return [[p0.x, p1.x], [p1.y, p0.y]];
		}
	},

	// toMap: function ([x, y]) {
	// 	let p = this.leaflet.containerPointToLayerPoint(x, y);
	// 	return [p.x, p.y];
	// },

	toMap_boundingbox: function ([[x0, x1], [y1, y0]]) {
		if (this.offset) {
			let offset = this.offset(this.leaflet.getZoom());
			let p0 = this.leaflet.containerPointToLatLng([x0 - offset.x, y0 - offset.y]),
				p1 = this.leaflet.containerPointToLatLng([x1 - offset.x, y1 - offset.y]);
			return [[p0.lng - offset.lon, p1.lng - offset.lon], [p0.lat - offset.lat, p1.lat - offset.lat]];
		} else {
			let p0 = this.leaflet.containerPointToLatLng([x0, y0]),
				p1 = this.leaflet.containerPointToLatLng([x1, y1]);
			return [[p0.lng, p1.lng], [p0.lat, p1.lat]];
		}
	},

	drawBoundingbox: function ([[lon0, lon1], [lat0, lat1]], options_) {
		if (this.offset) {
			let offset = this.offset(this.leaflet.getZoom());
			let points = [
				[lat0 + offset.lat, lon0 + offset.lon],
				[lat0 + offset.lat, lon1 + offset.lon],
				[lat1 + offset.lat, lon1 + offset.lon],
				[lat1 + offset.lat, lon0 + offset.lon],
				[lat0 + offset.lat, lon0 + offset.lon],
			], options = Object.assign({ color: 'teal', weight: 1.5 }, options_);
			return L.polyline(points, options)
				.addTo(this.leaflet);
		} else {
			let points = [
				[lat0, lon0],
				[lat0, lon1],
				[lat1, lon1],
				[lat1, lon0],
				[lat0, lon0],
			], options = Object.assign({ color: 'teal', weight: 1.5 }, options_);
			return L.polyline(points, options)
				.addTo(this.leaflet);
		}
	},

	// drawRect: function (bound, options_) {
	// 	let options = Object.assign({
	// 		weight: 0.4,
	// 		fillColor: 'red', fillOpacity: 0.5,
	// 		color: 'none', opacity: 0.5,
	// 	}, options_);
	// 	return L.rectangle(bound, options).addTo(this.leaflet);
	// },


	// drawRects: function (rects) {
	// 	let rectangles = [];
	// 	for (let { bound, options: options_ } of rects) {
	// 		let options = Object.assign({
	// 			weight: 0.4,
	// 			fillColor: 'red', fillOpacity: 0.5,
	// 			color: 'none', opacity: 0.5,
	// 		}, options_);
	// 		rectangles.push(L.rectangle(bound, options));
	// 	}
	// 	return L.layerGroup(rectangles).addTo(this.leaflet);
	// },
}

// export default {
// 	leaflet,
// 	toScreen,
// 	toScreen_boundingbox,
// 	toMap,
// 	toMap_boundingbox,
// 	drawBoundingbox,
// 	drawRect,
// 	drawRects,
// };