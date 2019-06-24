import * as d3 from 'd3';
import $ from 'jquery';

class BinnedMap {
	constructor(originalDomains, sizeType, filterDomain, xName, yName) {
		this.originalXDomain = originalDomains[0];
		this.originalYDomain = originalDomains[1];
		this.originalFilterDomain = originalDomains[2];
		this.originalSizeDomain = originalDomains[3];
		this.sizeType = sizeType;// 编码半径的type:count, min, max, average...
		this.filterDomain = filterDomain;
		this.arrayItem = [];
		this.countArray = [];
		this.linePosition = [];
		this.width = 700;
		this.height = 700;
		this._margins = { top: 30, left: 80, right: 30, bottom: 60 };
		this.points = [];// 聚合后的点
		this.xScale = '';
		this.yScale = '';
		this.xScaleReverse = '';
		this.yScaleReverse = '';
		this.xName = xName;
		this.yName = yName;
		// this.render();
	}

	render(xcount) {
		let me = this;

		me.xScale = d3.scaleLinear()
			.domain(this.originalXDomain)
			.range([0, this.quadrantWidth()]);
		me.yScale = d3.scaleLinear()
			.domain(this.originalYDomain)
			.range([this.quadrantHeight(), 0]);
		me.xScaleReverse = d3.scaleLinear()
			.domain([0, this.quadrantWidth()])
			.range(this.originalXDomain);
		me.yScaleReverse = d3.scaleLinear()
			.domain([0, this.quadrantHeight()])
			.range(this.originalYDomain);
		let ycount = xcount;
		// let xcount = 10, ycount = 10;// 分成10份
		// 清零
		if (me.countArray.length !== 0) me.countArray = [];
		for (let i = 0; i < ycount; i += 1) {
			if (me.arrayItem.length !== 0) me.arrayItem = [];
			for (let j = 0; j < xcount; j += 1) {
				me.arrayItem.push(0);
			}
			me.countArray.push(me.arrayItem);
		}
		me.computeCenterPositon(xcount);
		me.computeLinePosition(xcount);
		me.drawLines();
		me.drawBinnedmap(xcount);
	}
	computeLinePosition(xcount) {
		let me = this;
		let currentX = 0;
		let currentY = 0;
		let x = 0, y = 0;
		// 行 记录y值
		for (let i = 0; i < me.countArray.length - 1; i += 1) {
			let x1 = me._margins.left;
			let x2 = me.quadrantWidth() + me._margins.left;
			if (i === 0) {
				y = me.quadrantHeight() / xcount + me._margins.top;
			} else {
				y = currentY + me.quadrantHeight() / xcount + me._margins.top;
			}
			currentY += me.quadrantHeight() / xcount;
			me.linePosition.push([[x1, y], [x2, y]]);
		}
		// 列 记录x值
		for (let i = 0; i < me.countArray[0].length - 1; i += 1) {
			let y1 = me._margins.top;
			let y2 = me.quadrantHeight() + me._margins.top;
			if (i === 0) {
				x = me.quadrantWidth() / xcount + me._margins.left;
			} else {
				x = currentX + me.quadrantWidth() / xcount + me._margins.left;
			}
			currentX += me.quadrantWidth() / xcount;
			me.linePosition.push([[x, y1], [x, y2]]);
		}
	}
	drawLines() {
		let me = this;
		$('#scatterPlot-svg').find('.lines').find('line').remove();
		for (let i = 0; i < me.linePosition.length; i += 1) {
			me.drawBoundaryLine('gridlines',
				me.linePosition[i][0][0], me.linePosition[i][0][1], me.linePosition[i][1][0],
				me.linePosition[i][1][1], 'scatterPlot-svg');
		}
	}
	drawBoundaryLine(className, x1, y1, x2, y2, index) {
		let me = this;
		let $line = $(`#${index}`).find('.lines');
		if (className !== 'gridlines') {
			if ($line.find(`.${className}`)) {
				$line.find(`.${className}`).remove();
			}
		}
		d3.select(`#${index}`).select('svg.lines')
			.append('line')
			.attr('class', className)
			.attr('x1', x1)
			.attr('y1', y1)
			.attr('x2', x2)
			.attr('y2', y2)
			.attr('fill', 'none')
			.attr('stroke', '#979797')
			.attr('shape-rendering', 'crispEdges');
	}

	computeCenterPositon(xcount) {
		let me = this;
		let currentX = 0;
		let currentY = 0;
		let x = 0, y = 0;
		// 每个区域的点的聚合
		for (let i = 0; i < me.countArray.length; i += 1) {
			for (let j = 0; j < me.countArray[0].length; j += 1) {
				if (j === 0) {
					x = (me.quadrantWidth() / xcount) / 2;
					if (i === 0) {
						y = (me.quadrantHeight() / xcount) / 2;
					} else if (i === me.countArray.length - 1) {
						y = (currentY + me.quadrantHeight()) / 2;
					} else {
						y = (currentY + currentY + me.quadrantHeight() / xcount) / 2;
					}
					currentX += me.quadrantWidth() / xcount;
				} else if (j === me.countArray[0].length - 1) {
					x = (currentX + me.quadrantWidth()) / 2;
					if (i === 0) {
						y = (me.quadrantHeight() / xcount) / 2;
					} else if (i === me.countArray.length - 1) {
						y = (currentY + me.quadrantHeight()) / 2;
					} else {
						y = (currentY + currentY + me.quadrantHeight() / xcount) / 2;
					}
					currentX = 0;
				} else {
					x = (currentX + currentX + me.quadrantHeight() / xcount) / 2;
					if (i === 0) {
						y = (me.quadrantHeight() / xcount) / 2;
					} else if (i === me.countArray.length - 1) {
						y = (currentY + me.quadrantHeight()) / 2;
					} else {
						y = (currentY + currentY + me.quadrantHeight() / xcount) / 2;
					}
					currentX += me.quadrantWidth() / xcount;
				}

				me.points.push({
					x: i,
					y: j,
					// value: me.countArray[i][j],
					centerPosition: [x, y]
				});
			}
			currentY += me.quadrantHeight() / xcount;
		}
	}
	drawBinnedmap(xcount) {
		let me = this;
		d3.select('#binnedMap-svg').select('.body').selectAll('circle')
			.remove();
		d3.select('#binnedMap-svg')
			.remove();
		let svg = d3.select('#binnedMap').append('svg')
			.attr('height', this.height)
			.attr('width', 700)
			.attr('id', 'binnedMap-svg');
		svg.append('svg').attr('class', 'lines');
		svg.append('g')
			.attr('class', 'body')
			.attr('transform', `translate(${this._margins.left},${this._margins.top})`);
		let axesG = svg.append('g').attr('class', 'axes');
		let xAxis = d3.axisBottom(me.xScale).ticks(10);
		let yAxis = d3.axisLeft(me.yScale);
		let gXAxis = axesG.append('g')
			.attr('class', 'x axis')
			.attr('transform', () => `translate(${this._margins.left},${this.height - this._margins.bottom})`)
			.call(xAxis);
		gXAxis.append('text').attr('class', 'xText')
			.attr('transform', `translate(${this.quadrantWidth() / 2},${this._margins.bottom / 2 + 6})`)
			.style('text-anchor', 'middle')
			.style('fill', '#aaa')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.text(me.xName);
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
		let grids = [Math.ceil(xcount), Math.ceil(xcount)];
		let binnedMapMatrix = me.setBinnedMapMatrix(grids);
		let xInterval = me.quadrantWidth() / xcount,
			yInterval = me.quadrantHeight() / xcount;
		let legendData = [];
		for (let i = 0; i < binnedMapMatrix.length; i += 1) {
			legendData.push(binnedMapMatrix[i][2]);
		}
		let discreteLegendData = me.computeLegend(legendData);
		me.renderLegend(discreteLegendData);

		d3.select('#binnedMap-svg')
			.select('.body')
			.selectAll('circle')
			.data(binnedMapMatrix)
			.enter()
			.append('circle')
			.attr('cx', d => me.points[d[0] * grids[0] + d[1]].centerPosition[0])
			.attr('cy', d => me.points[d[0] * grids[0] + d[1]].centerPosition[1])
			.attr('r', d => d[2] < 0 ? 0 : d[2] / 1000)
			.attr('data-x', d => me.quadrantWidth() - d[0] * xInterval + xInterval / 2)
			.attr('data-y', d => me.quadrantHeight() - d[1] * yInterval + yInterval / 2)
			.attr('data-index', (d, i) => i)
			.style('fill', 'steelblue')
			.style('stroke', 'lightsteelblue');
	}
	computeLegend(legendData) {
		let max = d3.extent(legendData, d => d)[1];
		let maxNice = d3.scaleLinear()
			.domain([0, max])
			.range([0, 6000])
			.nice();
		console.log(maxNice.invert(max));
		// 图例显示三个圆
		let interval = Math.ceil(max / 3);
		let result = [];
		for (let i = 1; i <= 3; i += 1) {
			result.push(i * interval);
		}
		return result;
	}
	renderLegend(data) {
		let me = this;
		let svg = d3.select('#binnedMap-svg').append('svg')
			// .attr('height', this.height)
			// .attr('width', this.width)
			.attr('id', 'legendGroup')
			.attr("transform", "translate(" + (me.quadrantWidth() + 60) + ", " + me._margins.top + ")");
		svg.append('text')
			.attr('x', (me.quadrantWidth() + 60))
			.attr('y', me._margins.top)
			.text('carrierDelay');
		let legend = svg.selectAll('.legend')
			.data(data)
			.enter()
			.append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) {
				let legendX = (me.quadrantWidth() + 60) + 20;   //set position for each legend element
				let legendY = me._margins.top + (i + 1) * 30;
				return "translate(" + legendX + ", " + legendY + ")";
			});
	
	legend.append("circle")
		.attr("cx", 0)
		.attr("cy", 1)
		.attr("r", (d) => Math.log(d + 1))
		.attr("fill", 'steelblue');
		// .style("fill", _colors);
	
	legend.append("text")
		.attr("x", 20)
		.attr("y", 9)
		.classed("legendtext", true)
		.text((d) => d);
	}
	quadrantWidth() {
		return this.width - this._margins.left - this._margins.right;
	}
	quadrantHeight() {
		return this.height - this._margins.top - this._margins.bottom;
	}
	setBinnedMapMatrix(grids) {
		let me = this;
		let [[xmin, xmax], [ymin, ymax]] = [this.originalXDomain, this.originalYDomain];
		let n = grids[0] * grids[1];
		let binnedMapMatrix = Array(n);
		let xranges = Array(grids[0]), yranges = Array(grids[1]);
		let xLinePosition = [ymin], yLinePosition = [xmin];
		for (let i = 0; i < me.linePosition.length / 2; i += 1) {
			xLinePosition.push(me.yScaleReverse((me.linePosition[i][1][1] - 30)));
		}
		xLinePosition.push(ymax);
		for (let i = me.linePosition.length / 2; i < me.linePosition.length; i += 1) {
			yLinePosition.push(me.xScaleReverse(me.linePosition[i][0][0] - 60));
		}
		yLinePosition.push(xmax);
		let yrangeNew = Array(grids[0]);
		for (let i = 0; i < xLinePosition.length - 1; i += 1) {
			yranges[i] = [ymax - xLinePosition[i + 1] + ymin, ymax - xLinePosition[i] + ymin];
		}
		for (let j = 0; j < yLinePosition.length - 1; j += 1) {
			xranges[j] = [yLinePosition[j], yLinePosition[j + 1]];
		}
		let idx = 0;
		let XScale_1024 = d3.scaleLinear()
			.domain(this.originalXDomain)
			.range([0,1024]);
		let YScale_1024 = d3.scaleLinear()
			.domain(this.originalYDomain)
			.range([0,1024]);
		let ZScale_1024 = d3.scaleLinear()
			.domain(this.originalFilterDomain)
			.range([0,1024]);
		let SizeScale_1024 = d3.scaleLinear()
			.domain(this.originalSizeDomain)
			.range([0,1024]);
		for (let i = 0; i < grids[1]; i += 1) {
			for (let j = 0; j < grids[0]; j += 1) {
				let xrange_1024 = [Math.floor(XScale_1024(xranges[j][0])), Math.floor(XScale_1024(xranges[j][1]))];
				let yrange_1024 = [Math.floor(YScale_1024(yranges[i][0])), Math.floor(YScale_1024(yranges[i][1]))];
				let zrange_1024 = [Math.floor(ZScale_1024(this.filterDomain[0])), Math.floor(ZScale_1024(this.filterDomain[1]))];
				let sizerange_1024 = [Math.floor(SizeScale_1024(this.originalSizeDomain[0])), Math.floor(SizeScale_1024(this.originalSizeDomain[1]))];
				// let result = window.rtree.search([xrange_1024, yrange_1024, zrange_1024, sizerange_1024]);
				let result = window.rtree.search([xrange_1024, yrange_1024, zrange_1024]);
				// let result = window.rtree.searchHistogramSAT([xranges[j], yranges[i], this.filterDomain], 'average');
				// console.log(result);
				let temp = 0;
				switch (this.sizeType) {
					case 'count':
						for (let i = 0; i < result.length; i++) {
							temp += result[i][2];
						}
						binnedMapMatrix[idx] = [i, j, temp];
						break;
					case 'min':
						for (let i = 0; i < result.length; i++) {
							temp = Math.min(result[i][2], temp);
						}
						binnedMapMatrix[idx] = [i, j, temp];
						break;
					case 'max':
						for (let i = 0; i < result.length; i++) {
							temp = Math.max(result[i][2], temp);
						}
						binnedMapMatrix[idx] = [i, j, temp];
						break;
					case 'average':
						let count = 0;
						for (let i = 0; i < result.length; i++) {
							count += result[i][2];
							temp += result[i][2] * (result[i][1] - result[i][0]);
						}
						binnedMapMatrix[idx] = [i, j, temp / count];
						break;
					default:
						for (let i = 0; i < result.length; i++) {
							temp += result[i][2];
						}
						binnedMapMatrix[idx] = [i, j, temp];
						// binnedMapMatrix[idx] = [i, j, result.reduce((sum, x) => sum + x, 0)];
						break;
				}
				idx += 1;
			}
		}
		return binnedMapMatrix;
	}
}

export default BinnedMap;
