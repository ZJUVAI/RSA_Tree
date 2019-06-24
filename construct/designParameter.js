var assert = require('assert')
var Parameter = {}
var fs = require("fs")


var Parameter = {}
Parameter.outdims = 4
Parameter.inndims = 1
Parameter.dataNum = 5000005
Parameter.parameterPath = './data/parameter.txt'
Parameter.cmakeFile = './src/CMakeLists.txt'
Parameter.cmakeModelFile = './src/CMakeListsModel.txt'
Parameter.excuteFile = './src/readFile.cpp'
Parameter.modelFile = './src/readModelFile.cpp'
Parameter.readFilePath = './data/poi_small_Data'
Parameter.floatRange = [ ['-180',  '180'], ['-90', '90'], ['0', '23'], ['0', '6']]
Parameter.integerRange = [[0, 3600], [0, 1800], [0, 23], [0, 6]]
Parameter.searchMinLength = [1, 1, 1, 1]
Parameter.outdivide = [60, 60, 24, 8]
Parameter.inndivide = [1]
Parameter.useHistgram = false
Parameter.insertThenUpate = false
Parameter.dynamicDivide = false
Parameter.maxLeafNum = 100
Parameter.minLeafNum = 50
Parameter.leafNodes = 20000
Parameter.satTablesize = 6000
Parameter.queryTimes = 10
assert(Parameter.integerRange.length == Parameter.outdims)
assert(Parameter.floatRange.length == Parameter.outdims)
assert(Parameter.searchMinLength.length == Parameter.outdims)
assert(Parameter.outdivide.length == Parameter.outdims)
assert(Parameter.inndivide.length == Parameter.inndims)

fs.writeFileSync('./result/Parameter.json', JSON.stringify(Parameter) , 'utf-8'); 