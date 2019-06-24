import * as d3 from 'd3';
import $ from 'jquery';

class ScatterPlotHistogram {
	constructor(originalXDomain, dataObj, xName, yName) {
		this.originalXDomain = originalXDomain;
		this.dataObj = dataObj;
		this.width = 700;
		this.height = 700;
		this._margins = { top: 50, left: 80, right: 30, bottom: 60 };
		this.xName = xName;
		this.yName = yName;
	}
	render() {
		let me = this;
		let svg = d3.select('#scatterPlot-h').append('svg')
			.attr('height', this.height)
			.attr('width', this.width)
			.attr('id', 'scatterPlot-h-svg');
		svg.append('svg').attr('class', 'lines');
		svg.append('g')
			.attr('class', 'body')
			.attr('transform', `translate(${this._margins.left},${this._margins.top})`);
		let xScale = d3.scaleLinear()
			.domain(this.originalXDomain)
			.range([0, this.quadrantWidth()]);
		let yScale = d3.scaleLinear()
			.domain([0, this.dataObj[0][1] * 2])
			.range([this.quadrantHeight() - 50, 50]);
		let axesG = svg.append('g').attr('class', 'axes');
		let xAxis = d3.axisBottom(xScale).ticks(10);
		let yAxis = d3.axisLeft(yScale);
		let gXAxis = axesG.append('g')
			.attr('class', 'x axis')
			.attr('transform', () => `translate(${this._margins.left},${(this.height - this._margins.bottom)/2 + 50})`)
			.call(xAxis)
			.selectAll('text')
			.style('text-anchor', 'start')
			.attr('font-size', '14px')
			.attr('transform', 'translate(-10,1)');
		gXAxis.append('text').attr('class', 'xText')
			.attr('transform', `translate(${this.quadrantWidth() / 2},${this._margins.bottom / 2 + 80})`)
			.style('text-anchor', 'middle')
			.style('fill', '#aaa')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.text(me.xName);
		$('#scatterPlot-h-XName').html(me.xName).css('top', '490px');
		let gYAxis = axesG.append('g')
			.attr('class', 'y axis')
			.attr('transform', () => `translate(${this._margins.left},${this._margins.top})`)
			.call(yAxis);
		gYAxis.append('text').attr('class', 'yText')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - this._margins.left / 2 - 16)
			.attr('x', 0 - this.quadrantHeight() / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.style('fill', '#aaa')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.text(me.yName);
		d3.select('#scatterPlot-h-svg').select('g.axes').select('.y').selectAll('g.tick').remove();
		// 画点
		let canvas = document.getElementById('scatterPlot-canvas-h');
		let ctx = canvas.getContext('2d');

		ctx.beginPath();
		for (let i = 0; i < this.dataObj.length; i += 1) {
			let cx = xScale(this.dataObj[i][0]);
			let cy = yScale(this.dataObj[i][1]);
			ctx.moveTo(cx + 10, cy - 30);
			// ctx.arc(cx, cy, 2, 0, Math.PI * 2);
			ctx.arc(cx, cy - 30, 10, 0, 360, false);
		}
		ctx.lineWidth = 3;
		ctx.strokeStyle = 'steelblue';
		ctx.stroke();

		// d3.select('#scatterPlot-svg')
		// 	.select('.body')
		// 	.selectAll('circle')
		// 	.data(this.dataObj)
		// 	.enter()
		// 	.append('circle')
		// 	.attr('cx', d => xScale(d[0]))
		// 	.attr('cy', d => yScale(d[1]))
		// 	.attr('r', 5)
		// 	.attr('data-x', d => d[0])
		// 	.attr('data-y', d => d[1])
		// 	// .attr('data-value', (d, i) => this.acceleration[i])
		// 	.attr('data-index', (d, i) => i)
		// 	.style('fill', 'steelblue')
		// 	.style('stroke', 'lightsteelblue');
	}
	quadrantWidth() {
		return this.width - this._margins.left - this._margins.right;
	}
	quadrantHeight() {
		return this.height - this._margins.top - this._margins.bottom;
	}
	clearCanvas() {
		let me = this;
		let cxt = document.getElementById('scatterPlot-canvas-h').getContext('2d');
		cxt.clearRect(0, 0, 510, 520);
	}
}
export default ScatterPlotHistogram;
