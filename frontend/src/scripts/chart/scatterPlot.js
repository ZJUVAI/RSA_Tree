import * as d3 from 'd3';
import $ from 'jquery';

class ScatterPlot {
	constructor(originalXDomain, originalYDomain, dataObj, xName, yName) {
		this.originalXDomain = originalXDomain;
		this.originalYDomain = originalYDomain;
		this.dataObj = dataObj[0];
		// this.acceleration = dataObj[1];
		this.width = 700;
		this.height = 700;
		this._margins = { top: 50, left: 80, right: 30, bottom: 60 };
		this.xName = xName;
		this.yName = yName;
		// this.render();
	}
	render() {
		let me = this;
		let svg = d3.select('#scatterPlot').append('svg')
			.attr('height', this.height)
			.attr('width', this.width)
			.attr('id', 'scatterPlot-svg');
		svg.append('svg').attr('class', 'lines');
		svg.append('g')
			.attr('class', 'body')
			.attr('transform', `translate(${this._margins.left},${this._margins.top})`);
		let xScale = d3.scaleLinear()
			.domain(this.originalXDomain)
			.range([0, this.quadrantWidth()]);
		let yScale = d3.scaleLinear()
			.domain(this.originalYDomain)
			.range([this.quadrantHeight(), 0]);
		let axesG = svg.append('g').attr('class', 'axes');
		let xAxis = d3.axisBottom(xScale).ticks(10);
		let yAxis = d3.axisLeft(yScale);
		let gXAxis = axesG.append('g')
			.attr('class', 'x axis')
			.attr('transform', () => `translate(${this._margins.left},${this.height - this._margins.bottom})`)
			.call(xAxis)
			.selectAll('text')
			.style('text-anchor', 'start')
			.attr('font-size', '14px')
			.attr('transform', 'translate(10,1) rotate(60)');
		gXAxis.append('text').attr('class', 'xText')
			.attr('transform', `translate(${this.quadrantWidth() / 2},${this._margins.bottom / 2 + 6})`)
			.style('text-anchor', 'middle')
			.style('fill', '#aaa')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.text(me.xName);
		$('#scatterPlotXName').html(me.xName);
		let gYAxis = axesG.append('g')
			.attr('class', 'y axis')
			.attr('transform', () => `translate(${this._margins.left},${this._margins.top})`)
			.call(yAxis)
			.attr('font-size', '14px');
		gYAxis.append('text').attr('class', 'yText')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - this._margins.left / 2 - 16)
			.attr('x', 0 - this.quadrantHeight() / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.style('fill', '#000')
			// .style('font-weight', 'bold')
			.style('font-size', '14px')
			// .text(me.yName);
		$('#scatterPlotYName').html(me.yName).css({'transform': 'rotate(-90deg)', 'left': '-40px'});
		// 画点
		let canvas = document.getElementById('scatterPlot-canvas');
		let ctx = canvas.getContext('2d');

		ctx.beginPath();
		for (let i = 0; i < this.dataObj.length; i += 1) {
			let cx = xScale(this.dataObj[i][0]);
			let cy = yScale(this.dataObj[i][1]);
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, 2, 0, Math.PI * 2);
		}
		ctx.fillStyle = 'steelblue'; // #f36
		ctx.fill();
	}
	quadrantWidth() {
		return this.width - this._margins.left - this._margins.right;
	}
	quadrantHeight() {
		return this.height - this._margins.top - this._margins.bottom;
	}
	clearCanvas() {
		let me = this;
		let cxt = document.getElementById('scatterPlot-canvas').getContext('2d');
		cxt.clearRect(0, 0, 590, 590);
	}
}
export default ScatterPlot;
