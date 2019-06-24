var assert = require('assert')
var fs = require('fs')
args = []
process.argv.forEach(function (val, index, array) {
    args.push({"index" : index, "val" : val})
    // console.log(index + ': ' + val);
});
outFile = './Parameter.json'
if(args.length > 2) { outFile = args[2]["val"] }
var Parameter = require(outFile)

let judge = (a) => a == true ? 1 : 0;
logger = fs.createWriteStream(Parameter.parameterPath, {})
logger.write([Parameter.outdims, Parameter.inndims].join(' ') + '\n')
logger.write(Parameter.integerRange.map((d) => d.join(' ')).join(' ') + '\n')
logger.write(Parameter.floatRange.map((d) => d.join(' ')).join(' ') + '\n')
logger.write(Parameter.searchMinLength.join(' ') + '\n')
logger.write(Parameter.outdivide.join(' ') + '\n')
logger.write(Parameter.inndivide.join(' ') + '\n')
logger.write([Parameter.useHistgram, Parameter.useHash, Parameter.useExpand].map((d) => d == true ? 1 : 0).join(' ') + '\n')
logger.write([judge(Parameter.useLayer), Parameter.layerMul].join(' ') + '\n')
logger.write(Parameter.queryTimes.toString() + '\n')

// var mul = Math.floor(Parameter.outdivide.reduce((a, b) => a * b) * Parameter.inndims) * Parameter.leafNodes
// if(Parameter.satTablesize < mul) {
//     Parameter.satTablesize = mul
// }
// console.log(Parameter)




// dataRead=fs.readFileSync(Parameter.modelFile,"utf-8");
// stringTmp = ''
// dataWrite = []
// for(let i = 0 ;i < dataRead.length; ++i) {
//     stringTmp += dataRead[i]
//     if(dataRead[i] == '\n') {
//         dataWrite.push(stringTmp)
//         stringTmp = ''
//     }
// }
// if(stringTmp != '') {
//     dataWrite.push(stringTmp)
// }
// for(var i = 0; i < dataWrite.length; ++i) {
//     if(dataWrite[i].includes('auto tree = RTree') ){
//         dataWrite[i] = '    auto tree = RTree<' + Parameter.inndims + ', int, '+Parameter.satTablesize+', ' + Parameter.outdims + ', int, float, ' + Parameter.maxLeafNum + ', ' + Parameter.minLeafNum + ', ' + Parameter.leafNodes + ' >(satSet);\n'
//     }
//     // if(dataWrite[i].includes('!stream.OpenRead')) {
//     //     dataWrite[i] = '    if (!stream.OpenRead(\"' + Parameter.readFilePath + '\")) {\n'
//     // }
//     // if(dataWrite[i].includes('freopen')) {
//     //     dataWrite[i] = '    freopen(\"' + Parameter.parameterPath + '\", \"r\", stdin);\n'
//     // }
    
// }
// logger = fs.createWriteStream(Parameter.excuteFile, {})
// writeData = ''
// for(var i = 0; i < dataWrite.length; ++i) {
//     writeData += dataWrite[i]
// }
// logger.write(writeData)
// logger.close()






// // dataRead=fs.readFileSync(Parameter.cmakeModelFile,"utf-8");
// // stringTmp = ''
// // dataWrite = []
// // for(let i = 0 ;i < dataRead.length; ++i) {
// //     stringTmp += dataRead[i]
// //     if(dataRead[i] == '\n') {
// //         dataWrite.push(stringTmp)
// //         stringTmp = ''
// //     }
// // }
// // if(stringTmp != '') {
// //     dataWrite.push(stringTmp)
// // }
// // var tmpFileName = Parameter.excuteFile
// // var excuteFileName = ''
// // for(var i = tmpFileName.length - 1; i >= 0; --i) {
// //     if(tmpFileName[i] == '/') {
// //         break;
// //     }
// //     excuteFileName = tmpFileName[i] + excuteFileName
// // }

// // for(var i = 0; i < dataWrite.length; ++i) {
// //     if(dataWrite[i].includes('add_executable(Test ') ){
// //         dataWrite[i] = 'add_executable(Test ' + excuteFileName +')\n'
// //     }
// // }
// // logger = fs.createWriteStream(Parameter.cmakeFile, {})
// // writeData = ''
// // for(var i = 0; i < dataWrite.length; ++i) {
// //     writeData += dataWrite[i]
// // }
// // logger.write(writeData)
// // logger.close()


// // var exec = require('child_process');
// // exec.exec('bash Linux_Make.sh', (err, stdout, stderr) => {
// //   if (err) {
// //     return;
// //   }
// //   console.log(`stdout: ${stdout}`);
// // });



